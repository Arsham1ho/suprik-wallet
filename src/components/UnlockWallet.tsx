import { useState, useEffect, FormEvent } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, AlertCircle, Fingerprint } from "lucide-react";
import { GradientButton } from "./GradientButton";
import { WalletStorage } from "../utils/wallet";
import { useWallet } from "../utils/WalletContext";
import { useTheme } from "../utils/ThemeContext";
import { toast } from "sonner";
import {
  authenticateBiometric,
  getBiometricTypeName,
  isBiometricAvailable,
  type BiometricSettings,
} from "../utils/biometric";
import { getUserSettings } from "../utils/userSettings";

interface UnlockWalletProps {
  walletId: string;
  onUnlock: () => void;
  onSignOut: () => void;
}

export function UnlockWallet({
  walletId,
  onUnlock,
  onSignOut,
}: UnlockWalletProps) {
  const wallet = useWallet();
  const { colors } = useTheme();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoUnlocking, setAutoUnlocking] = useState(true);
  const [biometricSettings, setBiometricSettings] =
    useState<BiometricSettings | null>(null);
  const [useFingerprintAuth, setUseFingerprintAuth] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false); // Track if biometric check is done
  const [authenticatingBiometric, setAuthenticatingBiometric] = useState(false);
  const biometricType = getBiometricTypeName();

  // Check biometric availability and settings on mount - run in parallel, don't block UI
  useEffect(() => {
    const checkBiometricSetup = async () => {
      // Check if device supports biometric (this is fast, local check)
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);
      setBiometricReady(true); // Mark biometric check as done

      if (!available) {
        console.log("[UnlockWallet] Biometric not available on this device");
        return;
      }

      // Load user's biometric settings from localStorage (instant, no server call)
      try {
        const settings = getUserSettings(walletId);

        // Build biometric settings from localStorage
        const biometric: BiometricSettings | null = settings.biometricEnabled ? {
          enabled: true,
          autoLockMinutes: settings.autoLockMinutes || 5,
          requireForTransactions: true,
        } : null;

        setBiometricSettings(biometric);

        // If user has enabled fingerprint auth, switch to fingerprint mode
        if (biometric?.enabled) {
          console.log(
            "[UnlockWallet] Fingerprint authentication enabled by user"
          );
          setUseFingerprintAuth(true);
        }
      } catch (error) {
        console.error(
          "[UnlockWallet] Error loading biometric settings:",
          error
        );
      }
    };

    // Run biometric check immediately (don't wait for auto-unlock)
    checkBiometricSetup();
  }, [walletId]);

  // Try to auto-unlock with OAuth password on mount (runs in background, doesn't block UI)
  useEffect(() => {
    const tryAutoUnlock = async () => {
      try {
        // Check if this is an OAuth wallet
        const authMethod = localStorage.getItem(`${walletId}_auth_method`);
        if (authMethod === "social") {
          console.log(
            "[UnlockWallet] 🔓 Attempting auto-unlock for OAuth wallet..."
          );

          // Get stored OAuth password
          const oauthPassword = await WalletStorage.getOAuthPassword();

          if (oauthPassword) {
            console.log(
              "[UnlockWallet] 🔑 OAuth password retrieved successfully"
            );
            const success = await wallet.unlock(oauthPassword);

            if (success) {
              console.log("[UnlockWallet] ✅ Auto-unlock successful!");
              toast.success("Welcome back!");
              onUnlock();
              return;
            } else {
              console.warn(
                "[UnlockWallet] ⚠️ Auto-unlock failed - password decryption failed"
              );
            }
          } else {
            console.log(
              "[UnlockWallet] ℹ️ No OAuth password stored, manual unlock required"
            );
          }
        } else {
          console.log(
            "[UnlockWallet] ℹ️ Not an OAuth wallet, manual unlock required"
          );
        }
      } catch (error) {
        console.error("[UnlockWallet] ❌ Auto-unlock error:", error);
      } finally {
        // Always show the unlock UI after auto-unlock attempt
        setAutoUnlocking(false);
      }
    };

    // Quick timeout to show UI faster - don't block for too long
    const timeout = setTimeout(() => {
      setAutoUnlocking(false);
    }, 1500); // Max 1.5 seconds wait

    tryAutoUnlock();

    return () => clearTimeout(timeout);
  }, [walletId]);

  const handleFingerprintAuth = async () => {
    setAuthenticatingBiometric(true);
    setError("");

    try {
      console.log("[UnlockWallet] 👆 Starting fingerprint authentication...");
      const result = await authenticateBiometric(
        walletId,
        "Unlock your wallet"
      );

      if (result.success) {
        console.log("[UnlockWallet] ✅ Fingerprint authentication successful");

        // Get the stored password (stored when user enabled fingerprint)
        const storedPassword = await WalletStorage.getOAuthPassword();

        if (storedPassword) {
          console.log(
            "[UnlockWallet] 🔓 Unlocking wallet with stored password..."
          );
          const success = await wallet.unlock(storedPassword);

          if (success) {
            console.log("[UnlockWallet] ✅ Wallet unlocked successfully!");
            toast.success("Welcome back!");
            onUnlock();
            return;
          } else {
            // This shouldn't happen but handle it gracefully
            console.error(
              "[UnlockWallet] ❌ Failed to unlock with stored password"
            );
            toast.error("Failed to unlock wallet", {
              description: "Please enter your password manually",
            });
            setError("Wallet unlock failed. Please use your password.");
            setUseFingerprintAuth(false);
            return;
          }
        } else {
          // No stored password - this shouldn't happen if fingerprint is enabled
          console.error(
            "[UnlockWallet] ❌ No stored password found for fingerprint unlock"
          );
          toast.error("Fingerprint setup incomplete", {
            description: "Please disable and re-enable fingerprint in Settings",
          });
          setError(
            "No stored password found. Please re-enable fingerprint in Settings."
          );
          setUseFingerprintAuth(false);
        }
      } else {
        // Fingerprint failed - switch to password mode
        console.log(
          "[UnlockWallet] ❌ Fingerprint authentication failed, switching to password mode"
        );

        if (result.cancelled) {
          toast.error("Fingerprint authentication cancelled", {
            description: "Please use your password to unlock",
          });
        } else {
          toast.error("Fingerprint authentication failed", {
            description: "Please use your password to unlock",
          });
        }

        setError(
          result.error || "Fingerprint failed. Please enter your password."
        );
        setUseFingerprintAuth(false); // Switch to password mode
      }
    } catch (error: any) {
      console.error("[UnlockWallet] ❌ Fingerprint auth error:", error);
      toast.error("Authentication error occurred", {
        description: "Please use your password to unlock",
      });
      setError("Fingerprint authentication error. Please use password.");
      setUseFingerprintAuth(false); // Switch to password mode on error
    } finally {
      setAuthenticatingBiometric(false);
    }
  };

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();

    if (!password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Use WalletContext to unlock
      const success = await wallet.unlock(password);

      if (!success) {
        setError("Incorrect password. Please try again.");
        toast.error("Incorrect password");
        setLoading(false);
        return;
      }

      console.log("[UnlockWallet] ✅ Wallet unlocked successfully");
      console.log("[UnlockWallet] Addresses:", wallet.addresses);
      toast.success("Welcome back!");
      onUnlock();
    } catch (err: any) {
      console.error("[UnlockWallet] ❌ Unlock error:", err);

      // Better error messages based on error type
      if (err.name === "OperationError" || err.message?.includes("decrypt")) {
        setError(
          'Wallet data appears corrupted. Please use "Forgot Password" to recover.'
        );
        toast.error("Decryption failed - wallet data may be corrupted", {
          description:
            'Use "Forgot Password" to recover with your recovery phrase',
          duration: 5000,
        });
      } else {
        setError("Failed to unlock wallet. Please try again.");
        toast.error("Unlock failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auto-unlocking - but allow user to skip
  if (autoUnlocking) {
    return (
      <div className="min-h-screen bg-black text-white w-full flex items-center justify-center">
        <motion.div
          className="text-center space-y-4 w-full max-w-md px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg mx-auto"
            style={{
              background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})`,
              boxShadow: `0 10px 25px -5px ${colors.primary}80`,
            }}
          >
            <img src="/sup_logo.png" alt="Suprik" className="w-24 h-24 rounded-full object-cover" />
          </div>
          <div className="relative">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: colors.primary }}
            ></div>
          </div>
          <p className="text-white font-medium">Unlocking your wallet...</p>
          <p className="text-slate-400 text-sm">Please wait</p>

          {/* Allow user to skip auto-unlock and use password */}
          <button
            type="button"
            onClick={() => setAutoUnlocking(false)}
            className="text-sm text-slate-400 transition-colors mt-4"
            style={{ color: undefined }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
            onMouseLeave={(e) => e.currentTarget.style.color = ''}
          >
            Use password instead
          </button>
        </motion.div>
      </div>
    );
  }

  const handleForgotPassword = () => {
    if (
      confirm(
        "Forgot your password? You'll need to import your wallet again using your 12-word recovery phrase. Continue?"
      )
    ) {
      onSignOut();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white w-full flex items-center justify-center">
      <motion.div
        className="w-full max-w-md space-y-8 px-6 unlock-wallet-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Logo/Icon */}
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})`,
              boxShadow: `0 10px 25px -5px ${colors.primary}80`,
            }}
          >
            <img src="/sup_logo.png" alt="Suprik" className="w-24 h-24 rounded-full object-cover" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-slate-400">
              {useFingerprintAuth && biometricAvailable
                ? `Use ${biometricType} to unlock your wallet`
                : "Enter your password to unlock your wallet"}
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Wallet: {walletId.slice(0, 6)}...{walletId.slice(-4)}
            </p>
          </div>
        </motion.div>

        {/* Unlock Form */}
        <motion.form
          onSubmit={handleUnlock}
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Show fingerprint auth if enabled */}
          {useFingerprintAuth && biometricAvailable ? (
            <div className="space-y-4">
              {/* Fingerprint Icon */}
              <motion.div
                className="flex justify-center"
                animate={{
                  scale: authenticatingBiometric ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 1.5,
                  repeat: authenticatingBiometric ? Infinity : 0,
                }}
              >
                <div className="relative">
                  {/* Glow effect */}
                  {authenticatingBiometric && (
                    <div
                      className="absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse"
                      style={{
                        background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`,
                      }}
                    />
                  )}

                  {/* Fingerprint icon container */}
                  <div
                    className="relative w-24 h-24 rounded-full p-1"
                    style={{
                      background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryDark}, ${colors.accent})`,
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                      <Fingerprint className="w-12 h-12" style={{ color: colors.accent }} />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Fingerprint unlock button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  type="button"
                  onClick={handleFingerprintAuth}
                  disabled={authenticatingBiometric}
                  className="w-full h-12 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: authenticatingBiometric ? undefined : colors.primary,
                  }}
                  onMouseEnter={(e) => !authenticatingBiometric && (e.currentTarget.style.backgroundColor = colors.primaryDark)}
                  onMouseLeave={(e) => !authenticatingBiometric && (e.currentTarget.style.backgroundColor = colors.primary)}
                >
                  {authenticatingBiometric ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-5 h-5" />
                      Unlock with {biometricType}
                    </>
                  )}
                </button>
              </motion.div>

              {/* Switch to password */}
              <button
                type="button"
                onClick={() => setUseFingerprintAuth(false)}
                className="text-sm text-slate-400 transition-colors w-full text-center"
                onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                Use password instead
              </button>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm justify-center"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </div>
          ) : (
            /* Password form */
            <>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="w-full bg-slate-950/50 border-2 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none transition-all"
                    style={{
                      borderColor: `${colors.primary}40`,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}30`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = `${colors.primary}40`;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    placeholder="Enter your password"
                    autoFocus
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-2 text-red-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GradientButton
                  type="submit"
                  disabled={!password || loading}
                  className="w-full h-12"
                >
                  {loading ? "Unlocking..." : "Unlock Wallet"}
                </GradientButton>
              </motion.div>

              {/* Switch to fingerprint if available */}
              {biometricAvailable && biometricSettings?.enabled && (
                <button
                  type="button"
                  onClick={() => setUseFingerprintAuth(true)}
                  className="text-sm text-slate-400 transition-colors w-full text-center flex items-center justify-center gap-2"
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
                  onMouseLeave={(e) => e.currentTarget.style.color = ''}
                >
                  <Fingerprint className="w-4 h-4" />
                  Use {biometricType} instead
                </button>
              )}
            </>
          )}

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-slate-400 transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
            >
              Forgot password?
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={onSignOut}
              className="text-sm text-slate-400 transition-colors"
              onMouseEnter={(e) => e.currentTarget.style.color = colors.accent}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
            >
              Import different wallet
            </button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}
