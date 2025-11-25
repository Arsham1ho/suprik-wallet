import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { GradientButton } from './GradientButton';
import { Button } from './ui/button';
import { SecureStorage, WalletStorage } from '../utils/wallet';
import { useWallet } from '../utils/WalletContext';
import { toast } from 'sonner@2.0.3';

interface UnlockWalletProps {
  walletId: string;
  onUnlock: () => void;
  onSignOut: () => void;
}

export function UnlockWallet({ walletId, onUnlock, onSignOut }: UnlockWalletProps) {
  const wallet = useWallet();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoUnlocking, setAutoUnlocking] = useState(true);

  // Try to auto-unlock with OAuth password on mount
  useEffect(() => {
    const tryAutoUnlock = async () => {
      try {
        // Check if this is an OAuth wallet
        const authMethod = localStorage.getItem(`${walletId}_auth_method`);
        if (authMethod === 'social') {
          console.log('[UnlockWallet] 🔓 Attempting auto-unlock for OAuth wallet...');
          
          // Get stored OAuth password
          const oauthPassword = await WalletStorage.getOAuthPassword();
          
          if (oauthPassword) {
            console.log('[UnlockWallet] 🔑 OAuth password found, unlocking...');
            const success = await wallet.unlock(oauthPassword);
            
            if (success) {
              console.log('[UnlockWallet] ✅ Auto-unlock successful!');
              toast.success('Welcome back!');
              onUnlock();
              return;
            } else {
              console.warn('[UnlockWallet] ⚠️ Auto-unlock failed, manual unlock required');
            }
          } else {
            console.log('[UnlockWallet] ℹ️ No OAuth password stored, manual unlock required');
          }
        }
      } catch (error) {
        console.error('[UnlockWallet] ❌ Auto-unlock error:', error);
      } finally {
        setAutoUnlocking(false);
      }
    };

    tryAutoUnlock();
  }, [walletId]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use WalletContext to unlock
      const success = await wallet.unlock(password);
      
      if (!success) {
        setError('Incorrect password. Please try again.');
        toast.error('Incorrect password');
        setLoading(false);
        return;
      }

      console.log('[UnlockWallet] ✅ Wallet unlocked successfully');
      console.log('[UnlockWallet] Addresses:', wallet.addresses);
      toast.success('Welcome back!');
      onUnlock();
    } catch (err: any) {
      console.error('[UnlockWallet] ❌ Unlock error:', err);
      
      // Better error messages based on error type
      if (err.name === 'OperationError') {
        setError('Decryption failed. Wrong password or corrupted data.');
        toast.error('Failed to decrypt wallet');
      } else {
        setError('Failed to unlock wallet. Please try again.');
        toast.error('Unlock failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while auto-unlocking
  if (autoUnlocking) {
    return (
      <div className="min-h-screen bg-black text-white w-full flex items-center justify-center px-6">
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50 mx-auto">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          </div>
          <p className="text-white font-medium">Unlocking your wallet...</p>
          <p className="text-slate-400 text-sm">Please wait</p>
        </motion.div>
      </div>
    );
  }

  const handleForgotPassword = () => {
    if (confirm('Forgot your password? You\'ll need to import your wallet again using your 12-word recovery phrase. Continue?')) {
      onSignOut();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white w-full flex items-center justify-center px-6">
      <motion.div 
        className="w-full max-w-md space-y-8"
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
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-slate-400">
              Enter your password to unlock your wallet
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
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
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

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <GradientButton
              type="submit"
              disabled={!password || loading}
              className="w-full h-12"
            >
              {loading ? 'Unlocking...' : 'Unlock Wallet'}
            </GradientButton>
          </motion.div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-slate-400 hover:text-purple-400 transition-colors"
            >
              Forgot password?
            </button>
            <span className="text-slate-600">•</span>
            <button
              type="button"
              onClick={onSignOut}
              className="text-sm text-slate-400 hover:text-purple-400 transition-colors"
            >
              Import different wallet
            </button>
          </div>
        </motion.form>

        {/* Security Note */}
        <motion.div 
          className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* // ... remove this code ... */}
        </motion.div>
      </motion.div>
    </div>
  );
}