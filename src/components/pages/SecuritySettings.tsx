import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import {
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  Download,
  Key,
  Copy,
  Check,
  Fingerprint,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { getUserSettings, saveUserSettings } from "../../utils/userSettings";
import {
  isBiometricAvailable,
  registerBiometric,
  removeBiometric,
  getBiometricTypeName,
  type BiometricSettings,
} from "../../utils/biometric";
import { SecureStorage, WalletStorage } from "../../utils/wallet";
import { useWallet } from "../../utils/WalletContext";
import { exportPrivateKey } from "../../utils/web3/walletManager";
import { AccountManager } from "../../utils/accountManager";
import bs58 from "bs58";

interface SecuritySettingsProps {
  onBack: () => void;
  walletId: string;
}

interface WalletInfo {
  seedPhrase: string | null;
  email?: string | null;
  authMethod?: string;
  createdAt: string;
  username?: string;
  walletName?: string;
  profilePicture?: string;
  networkStatus?: string;
}

interface UserSettings {
  language: string;
  currency: string;
  usePassword: boolean;
  password?: string;
  biometric?: BiometricSettings;
}

export function SecuritySettings({ onBack, walletId }: SecuritySettingsProps) {
  const wallet = useWallet();
  const [loading, setLoading] = useState(true);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [phraseVisible, setPhraseVisible] = useState(false);
  const [phraseConfirmed, setPhraseConfirmed] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [copiedWord, setCopiedWord] = useState<number | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [settingUpBiometric, setSettingUpBiometric] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState(false);
  const biometricType = getBiometricTypeName();

  // Private Key states
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);
  const [privateKeyConfirmed, setPrivateKeyConfirmed] = useState(false);
  const [loadingPrivateKey, setLoadingPrivateKey] = useState(false);
  const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);

  useEffect(() => {
    loadData();
    checkBiometric();
  }, [walletId]);

  const checkBiometric = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
    console.log("[SecuritySettings] Biometric available:", available);
  };

  const loadData = async () => {
    try {
      // Load wallet info from localStorage (client-side architecture)
      const storedAuthMethod =
        localStorage.getItem("saturn_auth_method") || "recovery-phrase";
      const storedSeedPhrase = null; // Never load from localStorage for security

      setWalletInfo({
        seedPhrase: storedSeedPhrase,
        email: null,
        authMethod: storedAuthMethod,
        createdAt: null,
        username: null,
        walletName: null,
        profilePicture: null,
        networkStatus: null,
      });

      // Load user settings from localStorage (client-side)
      try {
        console.log("[SecuritySettings] Loading settings from localStorage...");
        const settings = getUserSettings(walletId);
        setUserSettings({
          language: settings.language || 'en',
          currency: settings.currency || 'USD',
          usePassword: false,
          biometric: settings.biometricEnabled ? {
            enabled: true,
            autoLockMinutes: settings.autoLockMinutes || 5,
            requireForTransactions: false,
          } : undefined,
        });
      } catch (settingsError) {
        console.log(
          "[SecuritySettings] No user settings found, using defaults"
        );
      }

      console.log("[SecuritySettings] ✅ Data loaded from localStorage");
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load security settings");
    } finally {
      setLoading(false);
    }
  };

  // Update settings in localStorage (client-side, instant)
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...userSettings, ...newSettings };

      // Save to localStorage
      saveUserSettings({
        biometricEnabled: newSettings.biometric?.enabled,
        autoLockMinutes: newSettings.biometric?.autoLockMinutes,
      }, walletId);

      setUserSettings(updatedSettings as UserSettings);
      toast.success("Security settings updated");
      console.log("[SecuritySettings] ✅ Settings saved (client-side)");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    }
  };

  const setPassword = async () => {
    // Validate old password is provided
    if (!oldPassword) {
      toast.error("Please enter your current password");
      return;
    }

    // Validate new password
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    // Verify old password by trying to decrypt the mnemonic
    // This is the source of truth - the password encrypts the mnemonic locally
    try {
      const mnemonic = await SecureStorage.retrieveMnemonic(oldPassword);
      if (!mnemonic) {
        toast.error("Current password is incorrect");
        return;
      }

      // Re-encrypt mnemonic with new password
      await SecureStorage.storeMnemonic(mnemonic, newPassword);

      // Also update server settings (non-blocking, for backup)
      try {
        await updateSettings({ usePassword: true });
      } catch (e) {
        console.warn("[SecuritySettings] Could not sync password change to server (non-critical)");
      }

      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
      setOldPassword("");
      toast.success("Password changed successfully");
    } catch (error) {
      console.error("Failed to change wallet password:", error);
      toast.error("Current password is incorrect");
    }
  };

  const removePassword = async () => {
    await updateSettings({ usePassword: false, password: undefined });
  };

  const toggleBiometric = async (enabled: boolean) => {
    if (enabled) {
      // Check availability first
      if (!biometricAvailable) {
        toast.error("Biometric authentication is not available on this device");
        return;
      }

      // Ask user for their password to store it securely
      const password = prompt(
        "Enter your wallet password to enable fingerprint authentication:"
      );

      if (!password) {
        toast.error(
          "Password is required to enable fingerprint authentication"
        );
        return;
      }

      // Verify the password is correct by trying to decrypt mnemonic
      try {
        const mnemonic = await SecureStorage.retrieveMnemonic(password);
        if (!mnemonic) {
          toast.error("Incorrect password. Please try again.");
          return;
        }
        // Password verified successfully
      } catch (error) {
        toast.error("Incorrect password. Please try again.");
        return;
      }

      // Enable biometric
      setSettingUpBiometric(true);
      try {
        const result = await registerBiometric(walletId);

        if (result.success) {
          // Store the password securely for fingerprint unlock
          await WalletStorage.setOAuthPassword(password);
          console.log(
            "[SecuritySettings] Password stored securely for fingerprint unlock"
          );

          const newBiometricSettings: BiometricSettings = {
            enabled: true,
            autoLockMinutes: 5, // Default to 5 minutes
            requireForTransactions: false,
          };
          await updateSettings({
            biometric: newBiometricSettings,
          });
          toast.success(`${biometricType} enabled successfully`);
        } else {
          if (!result.cancelled) {
            toast.error(result.error || "Failed to enable biometric");
          }
        }
      } catch (error) {
        console.error("[SecuritySettings] Biometric setup error:", error);
        toast.error("Failed to enable biometric");
      } finally {
        setSettingUpBiometric(false);
      }
    } else {
      // Disable biometric
      removeBiometric(walletId);
      await updateSettings({
        biometric: {
          enabled: false,
          autoLockMinutes: 0,
          requireForTransactions: false,
        },
      });
      toast.success(`${biometricType} disabled`);
    }
  };

  const updateAutoLock = async (minutes: number) => {
    const currentBiometric = userSettings?.biometric || {
      enabled: true,
      autoLockMinutes: 5,
      requireForTransactions: false,
    };
    await updateSettings({
      biometric: { ...currentBiometric, autoLockMinutes: minutes },
    });
  };

  const toggleRequireForTransactions = async (required: boolean) => {
    const currentBiometric = userSettings?.biometric || {
      enabled: true,
      autoLockMinutes: 5,
      requireForTransactions: false,
    };
    await updateSettings({
      biometric: { ...currentBiometric, requireForTransactions: required },
    });
  };

  const downloadLogs = () => {
    // Collect all accounts (sanitized - no private keys)
    const accounts = AccountManager.getAccounts().map(acc => ({
      id: acc.id,
      name: acc.name,
      accountIndex: acc.accountIndex,
      solanaAddress: acc.addresses?.solana || 'Not available',
      ethereumAddress: acc.addresses?.ethereum || 'Not available',
      createdAt: acc.createdAt ? new Date(acc.createdAt).toISOString() : 'Unknown',
      hasEmoji: !!acc.selectedEmoji,
      hasProfilePicture: !!acc.profilePicture,
    }));

    // Get active account
    const activeAccount = AccountManager.getActiveAccount();

    // Collect localStorage keys (sanitized - no sensitive data)
    const localStorageInfo: Record<string, string> = {};
    const sensitiveKeys = ['mnemonic', 'password', 'private', 'secret', 'key', 'seed'];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const isSensitive = sensitiveKeys.some(s => key.toLowerCase().includes(s));
        if (isSensitive) {
          localStorageInfo[key] = '[REDACTED]';
        } else if (key.startsWith('suprik_') || key.startsWith('saturn_')) {
          const value = localStorage.getItem(key);
          // Truncate long values
          localStorageInfo[key] = value && value.length > 200
            ? `${value.substring(0, 200)}... [truncated]`
            : value || '';
        }
      }
    }

    // Device and browser info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    // Network info
    const networkInfo = {
      networkMode: localStorage.getItem('suprik_network_mode') || localStorage.getItem('saturn_network_mode') || 'mainnet',
      isTestnet: localStorage.getItem('suprik_is_testnet') === 'true' || localStorage.getItem('saturn_is_testnet') === 'true',
      customRpc: localStorage.getItem('suprik_custom_rpc') ? '[SET]' : '[NOT SET]',
    };

    const logs = {
      appInfo: {
        name: "Suprik Wallet",
        version: "1.0.0",
        buildDate: "2024",
      },
      exportInfo: {
        timestamp: new Date().toISOString(),
        walletId: walletId ? `${walletId.substring(0, 8)}...${walletId.substring(walletId.length - 6)}` : 'Unknown',
      },
      accounts: {
        total: accounts.length,
        activeAccountId: activeAccount?.id || 'None',
        activeAccountName: activeAccount?.name || 'None',
        list: accounts,
      },
      settings: {
        biometricEnabled: userSettings?.biometric?.enabled || false,
        autoLockMinutes: userSettings?.biometric?.autoLockMinutes || 0,
        requireBiometricForTransactions: userSettings?.biometric?.requireForTransactions || false,
        language: userSettings?.language || 'en',
        currency: userSettings?.currency || 'USD',
      },
      network: networkInfo,
      device: deviceInfo,
      storage: localStorageInfo,
      diagnostics: {
        hasEncryptedMnemonic: !!localStorage.getItem('saturn_encrypted_mnemonic'),
        hasWalletId: !!localStorage.getItem('saturn_wallet_id'),
        accountsCount: accounts.length,
        isWalletUnlocked: wallet.isUnlocked,
        hasAddresses: !!(wallet.addresses?.solana),
      },
    };

    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suprik-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Logs downloaded successfully");
  };

  const copyToClipboard = async (text: string, wordIndex?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (wordIndex !== undefined) {
        setCopiedWord(wordIndex);
        setTimeout(() => setCopiedWord(null), 2000);
      }
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const removeRecoveryPhrase = () => {
    toast.error(
      "Cannot remove recovery phrase - it's required to access your wallet"
    );
  };

  const loadRecoveryPhrase = async () => {
    setLoadingPhrase(true);
    try {
      console.log(
        "[SecuritySettings] 🔍 Loading recovery phrase from WalletContext..."
      );

      // Check if wallet is already unlocked (from WalletContext)
      if (wallet.isUnlocked && wallet.mnemonic) {
        console.log(
          "[SecuritySettings] ✅ Wallet already unlocked, using mnemonic from context"
        );
        setWalletInfo({
          ...walletInfo,
          seedPhrase: wallet.mnemonic,
        });
        setPhraseConfirmed(true);
        setLoadingPhrase(false);
        return;
      }

      // If not unlocked, try OAuth password first
      const authMethod = localStorage.getItem(`${walletId}_auth_method`);
      if (authMethod === "social") {
        console.log(
          "[SecuritySettings] 🔑 OAuth wallet detected, trying auto-unlock..."
        );
        const oauthPassword = await WalletStorage.getOAuthPassword();

        if (oauthPassword) {
          const mnemonic = await SecureStorage.retrieveMnemonic(oauthPassword);
          if (mnemonic) {
            console.log(
              "[SecuritySettings] ✅ Mnemonic retrieved with OAuth password"
            );
            setWalletInfo({
              ...walletInfo,
              seedPhrase: mnemonic,
            });
            setPhraseConfirmed(true);
            setLoadingPhrase(false);
            return;
          }
        }
      }

      // If OAuth failed or not OAuth wallet, prompt for password
      const password = prompt(
        "Enter your wallet password to view recovery phrase:"
      );

      if (!password) {
        toast.error("Password required to view recovery phrase");
        setLoadingPhrase(false);
        return;
      }

      const mnemonic = await SecureStorage.retrieveMnemonic(password);

      if (!mnemonic) {
        toast.error("Incorrect password. Please try again.");
        setLoadingPhrase(false);
        return;
      }

      console.log("[SecuritySettings] ✅ Recovery phrase loaded successfully");
      setWalletInfo({
        ...walletInfo,
        seedPhrase: mnemonic,
      });
      setPhraseConfirmed(true);
      toast.success("Recovery phrase loaded");
    } catch (error) {
      console.error(
        "[SecuritySettings] ❌ Failed to load recovery phrase:",
        error
      );
      toast.error("Failed to load recovery phrase");
    } finally {
      setLoadingPhrase(false);
    }
  };

  const loadPrivateKey = async () => {
    setLoadingPrivateKey(true);
    try {
      console.log(
        "[SecuritySettings] 🔍 Loading private key from WalletContext..."
      );

      // Check if wallet is already unlocked (from WalletContext)
      if (wallet.isUnlocked && wallet.mnemonic) {
        console.log(
          "[SecuritySettings] ✅ Wallet already unlocked, using mnemonic from context"
        );
        // Need to get password for export - prompt user
        const pwd = prompt("Enter your wallet password to view private key:");
        if (!pwd) {
          toast.error("Password required to view private key");
          setLoadingPrivateKey(false);
          return;
        }
        const result = await exportPrivateKey(wallet.mnemonic, pwd);
        if (!result.success || !result.privateKey.length) {
          toast.error(result.error || "Failed to export private key");
          setLoadingPrivateKey(false);
          return;
        }
        const privateKeyBase58 = bs58.encode(result.privateKey);
        setPrivateKey(privateKeyBase58);
        setPrivateKeyConfirmed(true);
        setLoadingPrivateKey(false);
        return;
      }

      // If not unlocked, try OAuth password first
      const authMethod = localStorage.getItem(`${walletId}_auth_method`);
      if (authMethod === "social") {
        console.log(
          "[SecuritySettings] 🔑 OAuth wallet detected, trying auto-unlock..."
        );
        const oauthPassword = await WalletStorage.getOAuthPassword();

        if (oauthPassword) {
          const mnemonic = await SecureStorage.retrieveMnemonic(oauthPassword);
          if (mnemonic) {
            console.log(
              "[SecuritySettings] ✅ Mnemonic retrieved with OAuth password"
            );
            const result = await exportPrivateKey(mnemonic, oauthPassword);
            if (result.success && result.privateKey.length) {
              const privateKeyBase58 = bs58.encode(result.privateKey);
              setPrivateKey(privateKeyBase58);
              setPrivateKeyConfirmed(true);
              setLoadingPrivateKey(false);
              return;
            }
          }
        }
      }

      // If OAuth failed or not OAuth wallet, prompt for password
      const password = prompt(
        "Enter your wallet password to view private key:"
      );

      if (!password) {
        toast.error("Password required to view private key");
        setLoadingPrivateKey(false);
        return;
      }

      const mnemonic = await SecureStorage.retrieveMnemonic(password);

      if (!mnemonic) {
        toast.error("Incorrect password. Please try again.");
        setLoadingPrivateKey(false);
        return;
      }

      console.log("[SecuritySettings] ✅ Mnemonic retrieved, exporting private key...");
      const result = await exportPrivateKey(mnemonic, password);

      if (!result.success || !result.privateKey.length) {
        toast.error(result.error || "Failed to export private key");
        setLoadingPrivateKey(false);
        return;
      }

      const privateKeyBase58 = bs58.encode(result.privateKey);
      setPrivateKey(privateKeyBase58);
      setPrivateKeyConfirmed(true);
      toast.success("Private key loaded");
    } catch (error) {
      console.error("[SecuritySettings] ❌ Failed to load private key:", error);
      toast.error("Failed to load private key");
    } finally {
      setLoadingPrivateKey(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const seedWords = walletInfo?.seedPhrase?.split(" ") || [];

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">Security & Privacy</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Authentication Method Info */}
        {walletInfo?.authMethod && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h4 className="text-white font-medium">Authentication Method</h4>
            </div>
            <div className="space-y-2">
              <p className="text-slate-400 text-sm">
                {walletInfo.authMethod === "email"
                  ? `You signed up with email: ${walletInfo.email}`
                  : "You signed up with recovery phrase"}
              </p>
              {walletInfo.authMethod === "email" && walletInfo.email && (
                <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-3">
                  <p className="text-blue-200 text-xs">
                    💡 A recovery phrase was automatically generated for your
                    wallet. You can view it below.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Recovery Phrase Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="text-slate-400 text-sm px-2">Recovery Phrase</h3>

          <div className="bg-orange-950/20 border border-orange-900/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-orange-400" />
              <h4 className="text-orange-400 font-medium">
                Secret Recovery Phrase
              </h4>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Your 12-word recovery phrase is the master key to your wallet.
              Never share it with anyone.
            </p>

            {!phraseConfirmed ? (
              <div className="space-y-3">
                <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-yellow-300 border border-yellow-900/30">
                  ⚠️ Make sure you're in a private location before revealing
                  your phrase
                </div>
                <Button
                  onClick={loadRecoveryPhrase}
                  disabled={loadingPhrase}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  {loadingPhrase
                    ? "Loading..."
                    : "I Understand, Show Recovery Phrase"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <div
                    className={`transition-all duration-300 ${
                      !phraseVisible && "blur-md select-none"
                    }`}
                  >
                    <div className="grid grid-cols-3 gap-2">
                      {seedWords.map((word, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            phraseVisible && copyToClipboard(word, idx)
                          }
                          disabled={!phraseVisible}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-3 text-left hover:bg-slate-800 transition-colors relative group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-slate-500 text-xs block">
                                {idx + 1}.
                              </span>
                              <span className="text-white text-sm font-medium">
                                {word}
                              </span>
                            </div>
                            {phraseVisible && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                {copiedWord === idx ? (
                                  <Check className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {!phraseVisible && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        onClick={() => setPhraseVisible(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Reveal Phrase
                      </Button>
                    </div>
                  )}
                </div>

                {phraseVisible && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() =>
                        copyToClipboard(walletInfo?.seedPhrase || "")
                      }
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All Words
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-700"
                      onClick={() => setPhraseVisible(false)}
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide
                    </Button>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full border-red-900/30 text-red-400 hover:bg-red-950/20"
                  onClick={removeRecoveryPhrase}
                >
                  Remove Recovery Phrase
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        <Separator className="bg-slate-800" />

        {/* Private Key Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <h3 className="text-slate-400 text-sm px-2">Private Key</h3>

          <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-red-400" />
              <h4 className="text-red-400 font-medium">Private Key</h4>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Your private key gives full access to your wallet. Only share it
              if you know what you're doing.
            </p>

            {!privateKeyConfirmed ? (
              <div className="space-y-3">
                <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-yellow-300 border border-yellow-900/30">
                  ⚠️ Warning: Anyone with your private key can access your
                  wallet
                </div>
                <Button
                  onClick={loadPrivateKey}
                  disabled={loadingPrivateKey}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {loadingPrivateKey
                    ? "Loading..."
                    : "I Understand, Show Private Key"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <div
                    className={`transition-all duration-300 ${
                      !privateKeyVisible && "blur-md select-none"
                    }`}
                  >
                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                      <p className="text-white text-xs font-mono break-all">
                        {privateKey ? privateKey : "Loading..."}
                      </p>
                    </div>
                  </div>

                  {!privateKeyVisible && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        onClick={() => setPrivateKeyVisible(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Reveal Private Key
                      </Button>
                    </div>
                  )}
                </div>

                {privateKeyVisible && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={async () => {
                        if (privateKey) {
                          await navigator.clipboard.writeText(privateKey);
                          setCopiedPrivateKey(true);
                          setTimeout(() => setCopiedPrivateKey(false), 2000);
                          toast.success("Private key copied to clipboard");
                        }
                      }}
                    >
                      {copiedPrivateKey ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Private Key
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-700"
                      onClick={() => setPrivateKeyVisible(false)}
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide
                    </Button>
                  </div>
                )}

                <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-3">
                  <p className="text-red-200 text-xs">
                    🔐 This is your Solana private key in base58 format. Keep it
                    safe and never share it with anyone.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <Separator className="bg-slate-800" />

        {/* Biometric Authentication */}
        {biometricAvailable && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3"
            >
              <h3 className="text-slate-400 text-sm px-2">
                Biometric Authentication
              </h3>

              <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Fingerprint className="w-5 h-5 text-purple-400" />
                  <h4 className="text-white font-medium">{biometricType}</h4>
                </div>

                <p className="text-slate-400 text-sm mb-4">
                  Use {biometricType} to unlock your wallet and approve
                  transactions.
                </p>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg mb-3">
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span className="text-white text-sm">
                      Enable {biometricType}
                    </span>
                  </div>
                  <Switch
                    checked={userSettings?.biometric?.enabled || false}
                    onCheckedChange={toggleBiometric}
                    disabled={settingUpBiometric}
                  />
                </div>

                {/* Additional Settings (shown only when enabled) */}
                {userSettings?.biometric?.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3 mt-4"
                  >
                    {/* Auto-lock Timer */}
                    <div className="space-y-2">
                      <Label htmlFor="autoLock" className="text-slate-300">
                        Auto-lock After
                      </Label>
                      <p className="text-xs text-slate-500 mb-2">
                        Your wallet will lock after this time of inactivity
                      </p>
                      <select
                        id="autoLock"
                        value={userSettings?.biometric?.autoLockMinutes || 5}
                        onChange={(e) =>
                          updateAutoLock(parseInt(e.target.value))
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="0">Never</option>
                        <option value="1">1 minute</option>
                        <option value="2">2 minutes</option>
                        <option value="5">5 minutes (Recommended)</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                      </select>
                    </div>

                    {/* Require for Transactions */}
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div>
                        <p className="text-white text-sm">
                          Require for Transactions
                        </p>
                        <p className="text-slate-500 text-xs">
                          Ask for {biometricType} before sending
                        </p>
                      </div>
                      <Switch
                        checked={
                          userSettings?.biometric?.requireForTransactions ||
                          false
                        }
                        onCheckedChange={toggleRequireForTransactions}
                      />
                    </div>

                    {/* Info */}
                    <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-3">
                      <p className="text-blue-200 text-xs">
                        💡 Your biometric data is stored securely on your device
                        and never leaves it.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            <Separator className="bg-slate-800" />
          </>
        )}

        {/* Password Protection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <h3 className="text-slate-400 text-sm px-2">Password Protection</h3>

          <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-purple-400" />
              <h4 className="text-white font-medium">Change Password</h4>
            </div>

            <p className="text-slate-400 text-sm mb-4">
              Change the password you use to unlock your wallet.
            </p>

            <Button
              onClick={() => setShowPasswordForm(true)}
              className="w-full bg-[#ad46ff] hover:bg-[#9333ea]"
            >
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>

            {showPasswordForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 pt-4 border-t border-slate-700 space-y-3"
              >
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="bg-slate-900 border-slate-700"
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-900 border-slate-700"
                    placeholder="Enter password (min 8 characters)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-900 border-slate-700"
                    placeholder="Confirm password"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={setPassword}
                    className="flex-1 bg-[#ad46ff] hover:bg-[#9333ea]"
                  >
                    Save Password
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setNewPassword("");
                      setConfirmPassword("");
                      setOldPassword("");
                    }}
                    variant="outline"
                    className="flex-1 border-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <Separator className="bg-slate-800" />

        {/* Logs & Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h3 className="text-slate-400 text-sm px-2">Data & Logs</h3>

          <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Download className="w-5 h-5 text-blue-400" />
              <h4 className="text-white font-medium">App Logs</h4>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Download diagnostic logs for troubleshooting or backup purposes.
            </p>
            <Button
              onClick={downloadLogs}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download App Logs
            </Button>
          </div>
        </motion.div>

        {/* Security Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4"
        >
          <h4 className="text-blue-300 font-medium mb-2">🔒 Security Tips</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Never share your recovery phrase with anyone</li>
            <li>• Never share your private key with anyone</li>
            <li>• Store your phrase offline in a safe location</li>
            <li>• Use a strong, unique password</li>
            <li>• Beware of phishing attempts</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
