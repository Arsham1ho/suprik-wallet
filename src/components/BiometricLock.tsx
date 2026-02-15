import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Fingerprint, Lock, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  authenticateBiometric,
  getBiometricTypeName,
  isBiometricAvailable,
} from "../utils/biometric";
import { toast } from "sonner@2.0.3";
import { SuprikLogo } from "./SuprikLogo";

interface BiometricLockProps {
  walletId: string;
  onUnlock: () => void;
  onFallbackToPassword?: () => void;
}

export function BiometricLock({ walletId, onUnlock, onFallbackToPassword }: BiometricLockProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showPulse, setShowPulse] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(true);
  const biometricType = getBiometricTypeName();

  // Check biometric availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await isBiometricAvailable();
      setBiometricAvailable(available);

      if (!available) {
        toast.info("Biometric not available — please enter your password");
        // Fall back to password unlock instead of bypassing auth entirely
        setTimeout(() => {
          if (onFallbackToPassword) {
            onFallbackToPassword();
          }
        }, 500);
        return;
      }

      // Small delay for smooth animation
      setTimeout(() => {
        handleAuthenticate();
      }, 500);
    };

    checkAvailability();
  }, []);

  const handleAuthenticate = async () => {
    if (!biometricAvailable) {
      if (onFallbackToPassword) onFallbackToPassword();
      return;
    }

    setIsAuthenticating(true);
    setShowPulse(false);

    try {
      const result = await authenticateBiometric(
        walletId,
        "Unlock Suprik Wallet"
      );

      if (result.success) {
        toast.success("Wallet unlocked");
        onUnlock();
      } else {
        setAttempts((prev) => prev + 1);

        if (result.cancelled) {
          toast.error("Authentication cancelled");
        } else {
          toast.error(result.error || "Authentication failed");
        }

        // Re-enable pulse after failed attempt
        setTimeout(() => setShowPulse(true), 1000);
      }
    } catch (error) {
      console.error("[BiometricLock] Error:", error);
      toast.error("Authentication error");
      setTimeout(() => setShowPulse(true), 1000);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-md space-y-8 text-center"
        >
          {/* Logo/Icon */}
          <motion.div
            animate={
              showPulse
                ? {
                    scale: [1, 1.05, 1],
                    opacity: [1, 0.8, 1],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: showPulse ? Infinity : 0,
              ease: "easeInOut",
            }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-30 animate-pulse" />

              {/* Main icon container */}
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-1">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  {isAuthenticating ? (
                    <Loader2 className="w-16 h-16 text-purple-400 animate-spin" />
                  ) : (
                    <Fingerprint className="w-16 h-16 text-purple-400" />
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl text-white">Suprik Wallet</h1>
            <p className="text-slate-400">Locked</p>
          </div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <p className="text-slate-300">Use {biometricType} to unlock</p>

            {/* Unlock Button */}
            <Button
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
              size="lg"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Unlock Wallet
                </>
              )}
            </Button>

            {/* Attempts counter */}
            {attempts > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-slate-500"
              >
                Failed attempts: {attempts}
              </motion.p>
            )}
          </motion.div>

          {/* Help text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="pt-8 space-y-2"
          >
            <p className="text-xs text-slate-600">
              For security, your wallet locks automatically
            </p>
            <p className="text-xs text-slate-600">
              You can change this in Settings → Security
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
