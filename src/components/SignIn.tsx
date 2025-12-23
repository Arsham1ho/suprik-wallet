import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { GradientButton } from './GradientButton';
import { ArrowLeft, Key, FileText, Users, Check, Loader2, Fingerprint, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { validateMnemonic, deriveWalletId, SecureStorage, WalletStorage, deriveAddresses } from '../utils/wallet';
import { Card } from './ui/card';
import { useWallet } from '../utils/WalletContext';
import { fetchSolanaBalance } from '../utils/blockchain';
import { AccountManager } from '../utils/accountManager';
import { isBiometricAvailable, registerBiometric, getBiometricTypeName } from '../utils/biometric';
import type { BiometricSettings } from '../utils/biometric';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

type PasswordStrength = 'weak' | 'medium' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return 'weak';

  let score = 0;

  // Length bonus
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score >= 6) return 'strong';
  if (score >= 4) return 'medium';
  return 'weak';
}

interface DiscoveredAccount {
  index: number;
  address: string;
  balance: number;
  ethereumAddress: string;
}

interface SignInProps {
  onSuccess: (token: string, walletId: string) => void;
  onBack: () => void;
}

export function SignIn({ onSuccess, onBack }: SignInProps) {
  const wallet = useWallet();
  const [importMode, setImportMode] = useState<'select' | 'mnemonic' | 'privateKey'>('select');
  const [step, setStep] = useState<'input' | 'scanning' | 'select-accounts' | 'password' | 'confirm-password' | 'biometric'>('input');
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [derivedPublicKey, setDerivedPublicKey] = useState('');
  const [discoveredAccounts, setDiscoveredAccounts] = useState<DiscoveredAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [biometricName, setBiometricName] = useState('Touch ID');

  // Check biometric availability on mount
  useEffect(() => {
    isBiometricAvailable().then((available) => {
      setBiometricAvailable(available);
      if (available) {
        setBiometricName(getBiometricTypeName());
        setEnableBiometric(true); // Default to enabled if available
      }
    });
  }, []);

  // Security: Clear sensitive data from state after use
  const clearSensitiveState = () => {
    setWords(Array(12).fill(''));
    setPrivateKey('');
    setPassword('');
    setConfirmPassword('');
    setMnemonic('');
  };

  // Get password strength
  const passwordStrength = getPasswordStrength(password);
  const strengthColors = {
    weak: { bg: 'bg-red-500', text: 'text-red-400', label: 'Weak' },
    medium: { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Medium' },
    strong: { bg: 'bg-green-500', text: 'text-green-400', label: 'Strong' },
  };

  // Scan for accounts with balance on the seed phrase
  const scanForAccounts = async (mnemonicStr: string): Promise<DiscoveredAccount[]> => {
    const accounts: DiscoveredAccount[] = [];
    const MAX_SCAN = 10; // Scan up to 10 derivation paths
    const MAX_EMPTY_IN_ROW = 3; // Stop after 3 empty accounts in a row

    let emptyInRow = 0;

    for (let i = 0; i < MAX_SCAN; i++) {
      setScanProgress(((i + 1) / MAX_SCAN) * 100);

      try {
        const addresses = await deriveAddresses(mnemonicStr, i);

        // Check if this address has any balance
        const balanceData = await fetchSolanaBalance(addresses.solana, 'mainnet');
        const balance = balanceData.native;

        if (balance > 0 || balanceData.tokens.length > 0) {
          accounts.push({
            index: i,
            address: addresses.solana,
            balance: balance,
            ethereumAddress: addresses.ethereum,
          });
          emptyInRow = 0; // Reset empty counter
        } else {
          emptyInRow++;
          // Always include the first account (index 0) even if empty
          if (i === 0) {
            accounts.push({
              index: i,
              address: addresses.solana,
              balance: 0,
              ethereumAddress: addresses.ethereum,
            });
          }
          // Stop scanning after 3 empty accounts in a row (after index 0)
          if (emptyInRow >= MAX_EMPTY_IN_ROW && i > 0) {
            break;
          }
        }
      } catch (err) {
        // On error, still include the first account
        if (i === 0) {
          const addresses = await deriveAddresses(mnemonicStr, 0);
          accounts.push({
            index: 0,
            address: addresses.solana,
            balance: 0,
            ethereumAddress: addresses.ethereum,
          });
        }
        break;
      }
    }

    return accounts;
  };

  const handleAccountSelection = (index: number) => {
    setSelectedAccounts(prev => {
      if (prev.includes(index)) {
        // Don't allow deselecting all accounts
        if (prev.length === 1) return prev;
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleConfirmAccounts = () => {
    setStep('password');
  };

  // Validate and parse private key (supports base58 and array formats)
  const parsePrivateKey = (input: string): Uint8Array | null => {
    try {
      const trimmed = input.trim();

      // Try parsing as JSON array first (e.g., [1,2,3,...])
      if (trimmed.startsWith('[')) {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr) && arr.length === 64) {
          return new Uint8Array(arr);
        }
      }

      // Try parsing as base58 encoded string
      const decoded = bs58.decode(trimmed);
      if (decoded.length === 64) {
        return decoded;
      }

      return null;
    } catch {
      return null;
    }
  };

  const handlePrivateKeyChange = (value: string) => {
    setPrivateKey(value);
    setDerivedPublicKey('');

    const secretKey = parsePrivateKey(value);
    if (secretKey) {
      try {
        const keypair = Keypair.fromSecretKey(secretKey);
        setDerivedPublicKey(keypair.publicKey.toBase58());
      } catch {
        setDerivedPublicKey('');
      }
    }
  };

  const handlePrivateKeyContinue = () => {
    const secretKey = parsePrivateKey(privateKey);
    if (!secretKey) {
      toast.error('Invalid private key format');
      return;
    }

    try {
      Keypair.fromSecretKey(secretKey);
      setStep('password');
    } catch {
      toast.error('Invalid private key');
    }
  };

  const handlePrivateKeyImport = async () => {
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const secretKey = parsePrivateKey(privateKey);
      if (!secretKey) {
        throw new Error('Invalid private key');
      }

      const keypair = Keypair.fromSecretKey(secretKey);
      const publicKey = keypair.publicKey.toBase58();

      // Use public key as wallet ID for private key imports
      const walletId = publicKey.substring(0, 16);

      // ⚡ CRITICAL: Clear any existing account data before importing wallet
      // This prevents duplicate accounts from previous wallet sessions
      localStorage.removeItem('saturn_accounts');
      localStorage.removeItem('saturn_active_account_id');

      // Store the private key encrypted (we'll store it as a special format)
      // For private key imports, we store the base58 encoded secret key
      const privateKeyBase58 = bs58.encode(secretKey);
      await SecureStorage.storeMnemonic(`PRIVKEY:${privateKeyBase58}`, password);

      // Store wallet ID
      WalletStorage.setWalletId(walletId);
      WalletStorage.setCurrentAccount(0);

      // Store the public key directly since we can't derive it from a mnemonic
      localStorage.setItem('saturn_imported_pubkey', publicKey);
      localStorage.setItem('saturn_import_type', 'privateKey');

      // Generate default username
      const existingUsername = localStorage.getItem('saturn_username');
      if (!existingUsername) {
        const defaultUsername = `@user${walletId.substring(0, 6)}`;
        localStorage.setItem('saturn_username', defaultUsername);
      }

      // Unlock wallet
      const unlocked = await wallet.unlock(password);
      if (!unlocked) {
        throw new Error('Failed to unlock wallet after import');
      }

      // Register biometric if user opted in
      if (enableBiometric && biometricAvailable) {
        const biometricResult = await registerBiometric(walletId);

        if (biometricResult.success) {
          // Save biometric settings
          const biometricSettings: BiometricSettings = {
            enabled: true,
            autoLockMinutes: 5,
            requireForTransactions: false,
          };
          localStorage.setItem('biometric_settings', JSON.stringify(biometricSettings));
          toast.success(`Wallet imported with ${biometricName} enabled!`);
        } else if (!biometricResult.cancelled) {
          toast.success('Wallet imported successfully!');
        } else {
          toast.success('Wallet imported successfully!');
        }
      } else {
        toast.success('Wallet imported successfully!');
      }

      // Security: Clear sensitive data from state before navigation
      clearSensitiveState();
      onSuccess(walletId, walletId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value.trim().toLowerCase();
    setWords(newWords);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedWords = pastedText.trim().split(/\s+/);
    
    if (pastedWords.length === 12) {
      setWords(pastedWords.map(w => w.toLowerCase()));
      toast.success('Recovery phrase pasted');
    } else {
      toast.error('Please paste a 12-word recovery phrase');
    }
  };

  const handleContinueToPassword = async () => {
    const filledWords = words.filter(w => w.length > 0);
    if (filledWords.length !== 12) {
      toast.error('Please enter all 12 words');
      return;
    }

    const mnemonicString = words.join(' ');

    if (!validateMnemonic(mnemonicString)) {
      toast.error('Invalid recovery phrase');
      return;
    }

    setMnemonic(mnemonicString);

    // Start scanning for accounts
    setStep('scanning');
    setLoading(true);
    setScanProgress(0);

    try {
      const accounts = await scanForAccounts(mnemonicString);
      setDiscoveredAccounts(accounts);

      // Pre-select all accounts with balance, or just the first one
      const accountsWithBalance = accounts.filter(a => a.balance > 0);
      if (accountsWithBalance.length > 0) {
        setSelectedAccounts(accountsWithBalance.map(a => a.index));
      } else {
        setSelectedAccounts([0]); // Select first account by default
      }

      setLoading(false);

      if (accounts.length > 1 || (accounts.length === 1 && accounts.some(a => a.balance > 0))) {
        // Show account selection if multiple accounts or account with balance found
        setStep('select-accounts');
      } else {
        // Only one empty account found, proceed directly to password
        setStep('password');
      }
    } catch (err) {
      setLoading(false);
      toast.error('Failed to scan accounts. Proceeding with default account.');
      // Fallback to password step
      setSelectedAccounts([0]);
      setStep('password');
    }
  };

  const handleImport = async () => {
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      // Derive wallet ID from mnemonic
      const walletId = await deriveWalletId(mnemonic);

      // ⚡ CRITICAL: Clear any existing account data before importing wallet
      // This prevents duplicate accounts from previous wallet sessions
      localStorage.removeItem('saturn_accounts');
      localStorage.removeItem('saturn_active_account_id');

      // Encrypt and store mnemonic in localStorage
      await SecureStorage.storeMnemonic(mnemonic, password);

      // Store wallet ID
      WalletStorage.setWalletId(walletId);
      WalletStorage.setCurrentAccount(0);

      // Generate default username if not exists (Phantom style: lowercase)
      const existingUsername = localStorage.getItem('saturn_username');
      if (!existingUsername) {
        const defaultUsername = `@user${walletId.substring(0, 6)}`;
        localStorage.setItem('saturn_username', defaultUsername);
      }

      // Create accounts for all selected derivation paths
      const accounts: any[] = [];
      const accountsToImport = selectedAccounts.length > 0 ? selectedAccounts : [0];

      for (const selectedIndex of accountsToImport.sort((a, b) => a - b)) {
        const discoveredAccount = discoveredAccounts.find(a => a.index === selectedIndex);

        let address: string;
        let ethereumAddress: string;

        if (discoveredAccount) {
          // Use already discovered addresses
          address = discoveredAccount.address;
          ethereumAddress = discoveredAccount.ethereumAddress;
        } else {
          // Derive addresses for this index
          const addresses = await deriveAddresses(mnemonic, selectedIndex);
          address = addresses.solana;
          ethereumAddress = addresses.ethereum;
        }

        const uniqueAccountId = `${walletId}_${selectedIndex}_${Date.now()}`;

        accounts.push({
          id: uniqueAccountId,
          name: `Account ${accounts.length + 1}`,
          accountIndex: selectedIndex,
          addresses: {
            solana: address,
            ethereum: ethereumAddress,
          },
          createdAt: Date.now(),
        });

      }

      // Save all accounts
      localStorage.setItem('saturn_accounts', JSON.stringify(accounts));

      // Set first account as active
      if (accounts.length > 0) {
        AccountManager.setActiveAccount(accounts[0].id);
        localStorage.setItem('saturn_imported_pubkey', accounts[0].addresses.solana);
      }

      // Unlock the wallet immediately after import
      // This ensures addresses are derived and ready when user lands on Home
      const unlocked = await wallet.unlock(password);

      if (!unlocked) {
        throw new Error('Failed to unlock wallet after import');
      }

      // Register biometric if user opted in
      if (enableBiometric && biometricAvailable) {
        const biometricResult = await registerBiometric(walletId);

        if (biometricResult.success) {
          // Save biometric settings
          const biometricSettings: BiometricSettings = {
            enabled: true,
            autoLockMinutes: 5,
            requireForTransactions: false,
          };
          localStorage.setItem('biometric_settings', JSON.stringify(biometricSettings));
          toast.success(`Wallet imported with ${biometricName} enabled!`);
        } else if (!biometricResult.cancelled) {
          toast.success('Welcome back!');
        } else {
          toast.success('Welcome back!');
        }
      } else {
        const accountCount = accounts.length;
        toast.success(accountCount > 1
          ? `Welcome back! ${accountCount} accounts imported.`
          : 'Welcome back!');
      }

      // Security: Clear sensitive data from state before navigation
      clearSensitiveState();
      onSuccess(walletId, walletId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'biometric') {
      setStep('confirm-password');
    } else if (step === 'confirm-password') {
      setStep('password');
      setConfirmPassword('');
    } else if (step === 'password') {
      // Go back to account selection if we have discovered accounts, otherwise go to input
      if (importMode === 'mnemonic' && discoveredAccounts.length > 1) {
        setStep('select-accounts');
      } else {
        setStep('input');
      }
      setPassword('');
      setConfirmPassword('');
    } else if (step === 'select-accounts') {
      setStep('input');
      setDiscoveredAccounts([]);
      setSelectedAccounts([]);
      setScanProgress(0);
    } else if (step === 'scanning') {
      // Can't go back during scanning, but handle it just in case
      setStep('input');
    } else if (importMode !== 'select') {
      setImportMode('select');
      setPrivateKey('');
      setDerivedPublicKey('');
      setWords(Array(12).fill(''));
      setDiscoveredAccounts([]);
      setSelectedAccounts([]);
      setScanProgress(0);
      setPassword('');
      setConfirmPassword('');
    } else {
      onBack();
    }
  };

  // Handle password step continue
  const handlePasswordContinue = () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setStep('confirm-password');
  };

  // Handle confirm password step continue
  const handleConfirmPasswordContinue = async () => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    // If biometric available, go to biometric step, otherwise import wallet
    if (biometricAvailable) {
      setStep('biometric');
    } else {
      await performImport();
    }
  };

  // Handle biometric step continue
  const handleBiometricContinue = async (enable: boolean) => {
    setEnableBiometric(enable);
    await performImport();
  };

  // Perform the actual import
  const performImport = async () => {
    if (importMode === 'privateKey') {
      await handlePrivateKeyImport();
    } else {
      await handleImport();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white w-full">
      <div className="px-6 py-6 w-full">
        {/* Header */}
        <motion.div
          className="flex items-center mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Import Method Selection */}
          {importMode === 'select' && step === 'input' && (
            <motion.div
              key="select"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">Import Wallet</h1>
                <p className="text-slate-400 leading-relaxed">
                  Choose how you want to import your existing wallet.
                </p>
              </div>

              <div className="space-y-3">
                <motion.button
                  onClick={() => setImportMode('mnemonic')}
                  className="w-full bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-5 text-left hover:border-purple-500/50 transition-all group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">Recovery Phrase</h3>
                      <p className="text-sm text-slate-400">
                        Import using your 12-word secret recovery phrase (BIP-39)
                      </p>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setImportMode('privateKey')}
                  className="w-full bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-5 text-left hover:border-purple-500/50 transition-all group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Key className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">Private Key</h3>
                      <p className="text-sm text-slate-400">
                        Import using your Solana private key (base58 or byte array)
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Mnemonic Input Step */}
          {importMode === 'mnemonic' && step === 'input' && (
            <motion.div 
              key="mnemonic"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">Import Wallet</h1>
                <p className="text-slate-400 leading-relaxed">
                  Enter your 12-word secret recovery phrase to restore your wallet.
                </p>
              </div>

              <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
                <div className="grid grid-cols-2 gap-3" onPaste={handlePaste}>
                  {words.map((word, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <span className="text-slate-600 text-sm w-5 font-semibold">{index + 1}</span>
                      <input
                        type="text"
                        value={word}
                        onChange={(e) => handleWordChange(index, e.target.value)}
                        className="flex-1 min-w-0 bg-black/50 border border-slate-800/50 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium placeholder:text-slate-600"
                        placeholder="word"
                        autoComplete="off"
                      />
                    </motion.div>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-4">
                  Paste your entire phrase or type each word
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GradientButton
                  onClick={handleContinueToPassword}
                  disabled={words.filter(w => w.length > 0).length !== 12}
                  className="w-full h-12"
                >
                  Continue
                </GradientButton>
              </motion.div>
            </motion.div>
          )}

          {/* Private Key Input Step */}
          {importMode === 'privateKey' && step === 'input' && (
            <motion.div
              key="privateKey"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">Import Private Key</h1>
                <p className="text-slate-400 leading-relaxed">
                  Enter your Solana private key to import your wallet.
                </p>
              </div>

              <Card className="bg-slate-950/50 backdrop-blur-sm border-slate-800/50 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Private Key</label>
                    <textarea
                      value={privateKey}
                      onChange={(e) => handlePrivateKeyChange(e.target.value)}
                      className="w-full bg-black/50 border border-slate-800/50 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono resize-none"
                      placeholder="Paste your private key (base58 or byte array)"
                      rows={3}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  {derivedPublicKey && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-950/30 border border-green-900/30 rounded-lg p-3"
                    >
                      <p className="text-xs text-green-400 mb-1">Wallet Address:</p>
                      <p className="text-sm text-green-200 font-mono break-all">{derivedPublicKey}</p>
                    </motion.div>
                  )}

                  <p className="text-slate-500 text-xs">
                    Supports base58 encoded keys or JSON byte arrays [1,2,3,...]
                  </p>
                </div>
              </Card>

              <motion.div
                className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-amber-200/90 text-sm leading-relaxed">
                  <strong className="text-amber-400 font-semibold">Warning:</strong> Never share your private key. Anyone with your private key can access your funds.
                </p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GradientButton
                  onClick={handlePrivateKeyContinue}
                  disabled={!derivedPublicKey}
                  className="w-full h-12"
                >
                  Continue
                </GradientButton>
              </motion.div>
            </motion.div>
          )}

          {/* Scanning Step */}
          {step === 'scanning' && (
            <motion.div
              key="scanning"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-3 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold">Scanning for Accounts</h1>
                <p className="text-slate-400 leading-relaxed">
                  Looking for accounts with balance on this seed phrase...
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5">
                <motion.div
                  className="bg-purple-500 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-center text-sm text-slate-500">
                Checking derivation paths... {Math.round(scanProgress)}%
              </p>
            </motion.div>
          )}

          {/* Account Selection Step */}
          {step === 'select-accounts' && (
            <motion.div
              key="select-accounts"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">Select Accounts</h1>
                <p className="text-slate-400 leading-relaxed">
                  Choose which accounts you want to import.
                </p>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-sm text-green-200 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Found {discoveredAccounts.length} account{discoveredAccounts.length > 1 ? 's' : ''} on this seed phrase
                </p>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {discoveredAccounts.map((account) => (
                  <motion.button
                    key={account.index}
                    onClick={() => handleAccountSelection(account.index)}
                    className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                      selectedAccounts.includes(account.index)
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-slate-950/50 border-slate-800/50 hover:border-slate-600/50'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                        selectedAccounts.includes(account.index)
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {account.index + 1}
                      </div>
                      <div className="text-left">
                        <p className="text-base font-semibold text-white">
                          Account {account.index + 1}
                        </p>
                        <p className="text-sm text-slate-400 font-mono">
                          {account.address.slice(0, 6)}...{account.address.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {account.balance > 0 && (
                        <span className="text-sm px-3 py-1 rounded-lg bg-green-500/20 text-green-400 font-medium">
                          {account.balance.toFixed(4)} SOL
                        </span>
                      )}
                      {selectedAccounts.includes(account.index) && (
                        <Check className="w-6 h-6 text-purple-400" />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              <p className="text-sm text-slate-500 text-center">
                Select the accounts you want to import
              </p>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GradientButton
                  onClick={handleConfirmAccounts}
                  disabled={selectedAccounts.length === 0}
                  className="w-full h-12"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Import {selectedAccounts.length} Account{selectedAccounts.length > 1 ? 's' : ''}
                </GradientButton>
              </motion.div>
            </motion.div>
          )}

          {/* Password Step - Enter Password */}
          {step === 'password' && (
            <motion.div
              key="password"
              className="space-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Create Password</h1>
                <p className="text-slate-400 leading-relaxed">
                  Set a password to secure your imported wallet on this device.
                </p>
              </div>

              {/* Show selected accounts summary for mnemonic import */}
              {importMode === 'mnemonic' && selectedAccounts.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <p className="text-sm text-purple-200">
                    Importing {selectedAccounts.length} account{selectedAccounts.length > 1 ? 's' : ''} from this seed phrase
                  </p>
                </div>
              )}

              {/* Show derived address for private key import */}
              {importMode === 'privateKey' && derivedPublicKey && (
                <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Importing wallet:</p>
                  <p className="text-sm text-white font-mono break-all">{derivedPublicKey}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-lg"
                    placeholder="Enter password (min 8 characters)"
                    autoFocus
                  />
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex gap-1.5">
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        password.length >= 1 ? strengthColors[passwordStrength].bg : 'bg-slate-800'
                      }`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength === 'medium' || passwordStrength === 'strong' ? strengthColors[passwordStrength].bg : 'bg-slate-800'
                      }`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength === 'strong' ? strengthColors[passwordStrength].bg : 'bg-slate-800'
                      }`} />
                    </div>
                    <p className={`text-sm ${strengthColors[passwordStrength].text}`}>
                      Password strength: {strengthColors[passwordStrength].label}
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-blue-200/90 text-sm leading-relaxed">
                  <strong className="text-blue-400 font-semibold">Tip:</strong> Use a mix of uppercase, lowercase, numbers, and special characters for a stronger password.
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GradientButton
                  onClick={handlePasswordContinue}
                  disabled={password.length < 8}
                  className="w-full h-12"
                >
                  Continue
                </GradientButton>
              </motion.div>
            </motion.div>
          )}

          {/* Confirm Password Step */}
          {step === 'confirm-password' && (
            <motion.div
              key="confirm-password"
              className="space-y-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Confirm Password</h1>
                <p className="text-slate-400 leading-relaxed">
                  Enter your password again to make sure you remember it.
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-lg"
                  placeholder="Re-enter your password"
                  autoFocus
                />
              </div>

              {/* Password match indicator */}
              {confirmPassword.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 ${
                    password === confirmPassword ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {password === confirmPassword ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Passwords match</span>
                    </>
                  ) : (
                    <span className="text-sm">Passwords do not match</span>
                  )}
                </motion.div>
              )}

              <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-amber-200/90 text-sm leading-relaxed">
                  <strong className="text-amber-400 font-semibold">Important:</strong> This password cannot be recovered. Make sure to remember it!
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GradientButton
                  onClick={handleConfirmPasswordContinue}
                  disabled={!confirmPassword || password !== confirmPassword || loading}
                  className="w-full h-12"
                >
                  {loading && !biometricAvailable ? 'Importing...' : 'Continue'}
                </GradientButton>
              </motion.div>
            </motion.div>
          )}

          {/* Biometric Step */}
          {step === 'biometric' && (
            <motion.div
              key="biometric"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-2 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4"
                >
                  <Fingerprint className="w-12 h-12 text-purple-400" />
                </motion.div>
                <h1 className="text-3xl font-bold">Enable {biometricName}?</h1>
                <p className="text-slate-400 leading-relaxed">
                  Unlock your wallet quickly and securely using {biometricName}.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Quick Access</p>
                    <p className="text-slate-400 text-sm">Unlock in seconds without typing</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Secure</p>
                    <p className="text-slate-400 text-sm">Your biometric data stays on device</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <GradientButton
                  onClick={() => handleBiometricContinue(true)}
                  disabled={loading}
                  className="w-full h-12"
                >
                  {loading ? 'Importing Wallet...' : `Enable ${biometricName}`}
                </GradientButton>

                <Button
                  variant="ghost"
                  onClick={() => handleBiometricContinue(false)}
                  disabled={loading}
                  className="w-full h-12 text-slate-400 hover:text-white hover:bg-slate-900/50"
                >
                  Skip for now
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}