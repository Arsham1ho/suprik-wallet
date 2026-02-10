import { useState } from 'react';
import { Button } from './ui/button';
import { GradientButton } from './GradientButton';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { createSupabaseClient } from '../utils/supabase/client';
import { generateMnemonic, deriveWalletId, SecureStorage, WalletStorage } from '../utils/wallet';
import { useWallet } from '../utils/WalletContext';

interface EmailSignInProps {
  onSuccess: (token: string, walletId: string) => void;
  onBack: () => void;
  isSignUp?: boolean;
}

export function EmailSignIn({ onSuccess, onBack, isSignUp = false }: EmailSignInProps) {
  const wallet = useWallet();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    try {
      const supabase = createSupabaseClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        }
      });

      if (error) {
        if (error.message.includes('provider') || error.message.includes('not enabled') || error.message.includes('Unsupported')) {
          throw new Error('NOT_CONFIGURED');
        }
        throw error;
      }

      toast.success(`Redirecting to ${provider === 'google' ? 'Google' : 'Apple'}...`);
    } catch (error: any) {
      if (error.message === 'NOT_CONFIGURED') {
        toast.error(
          `${provider === 'google' ? 'Google' : 'Apple'} sign-in is not yet configured. Please use email sign-in instead.`,
          { duration: 5000 }
        );
      } else {
        toast.error(`Failed to sign in with ${provider === 'google' ? 'Google' : 'Apple'}: ${error.message}`);
      }
      setSocialLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    if (isSignUp) {
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
      if (!confirmPassword) {
        toast.error('Please confirm your password');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      const supabase = createSupabaseClient();

      if (isSignUp) {
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('This email is already registered. Try signing in instead.');
          }
          throw error;
        }

        if (!data.user) {
          throw new Error('Failed to create account');
        }

        // Generate mnemonic and create local wallet
        const mnemonic = await generateMnemonic();
        const newWalletId = await deriveWalletId(mnemonic);

        // Encrypt and store mnemonic with user's password
        await SecureStorage.storeMnemonic(mnemonic, password);
        WalletStorage.setWalletId(newWalletId);
        WalletStorage.setCurrentAccount(0);

        // Store email auth info
        localStorage.setItem(`email_wallet_${data.user.id}`, newWalletId);
        localStorage.setItem(`${newWalletId}_auth_method`, 'email');
        localStorage.setItem(`${newWalletId}_auth_email`, email);

        // Generate default username
        const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
        const defaultUsername = `@${emailPrefix}${newWalletId.substring(0, 4)}`;
        localStorage.setItem('saturn_username', defaultUsername);

        // Unlock wallet
        const unlocked = await wallet.unlock(password);
        if (!unlocked) {
          throw new Error('Failed to unlock wallet after creation');
        }

        toast.success('Account created successfully!');
        onSuccess(data.session?.access_token || newWalletId, newWalletId);
      } else {
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Invalid email or password');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Please check your email and confirm your account first');
          }
          throw error;
        }

        // Check if local wallet exists
        if (!SecureStorage.hasWallet()) {
          throw new Error('No wallet found on this device. Please use your recovery phrase to restore your wallet.');
        }

        // Try to unlock with the password
        const unlocked = await wallet.unlock(password);
        if (!unlocked) {
          throw new Error('Wrong password or wallet data mismatch. Try your recovery phrase instead.');
        }

        const existingWalletId = WalletStorage.getWalletId() || '';
        toast.success('Welcome back!');
        onSuccess(data.session?.access_token || existingWalletId, existingWalletId);
      }
    } catch (error: any) {
      toast.error(error.message || (isSignUp ? 'Sign up failed' : 'Sign in failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white w-full overflow-y-auto">
      <div className="px-6 py-6 w-full pb-20">
        {/* Header */}
        <motion.div
          className="flex items-center mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="text-slate-400 leading-relaxed">
              {isSignUp
                ? 'Create your wallet with email and password'
                : 'Sign in to access your wallet'
              }
            </p>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl px-11 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-slate-600"
                placeholder="your.email@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl px-11 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-slate-600"
                placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {isSignUp && (
              <p className="text-xs text-slate-500">At least 8 characters</p>
            )}
          </div>

          {/* Confirm Password (Sign Up Only) */}
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl px-11 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-slate-600"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <GradientButton
              type="submit"
              className="w-full h-12"
              disabled={loading}
            >
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </GradientButton>
          </motion.div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-sm text-slate-500">or continue with</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          {/* Social Sign In Options */}
          <div className="space-y-3">
            {/* Google Sign In */}
            <motion.button
              type="button"
              onClick={() => handleSocialSignIn('google')}
              disabled={socialLoading !== null || loading}
              className="w-full"
              whileHover={{ scale: (socialLoading || loading) ? 1 : 1.02 }}
              whileTap={{ scale: (socialLoading || loading) ? 1 : 0.98 }}
            >
              <div className="bg-white/5 border border-slate-700/50 rounded-2xl p-4 text-left hover:border-slate-600 transition-all group relative overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-center gap-3">
                  {socialLoading === 'google' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span className="font-medium">Continue with Google</span>
                    </>
                  )}
                </div>
              </div>
            </motion.button>

            {/* Apple Sign In */}
            <motion.button
              type="button"
              onClick={() => handleSocialSignIn('apple')}
              disabled={socialLoading !== null || loading}
              className="w-full"
              whileHover={{ scale: (socialLoading || loading) ? 1 : 1.02 }}
              whileTap={{ scale: (socialLoading || loading) ? 1 : 0.98 }}
            >
              <div className="bg-white/5 border border-slate-700/50 rounded-2xl p-4 text-left hover:border-slate-600 transition-all group relative overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-center gap-3">
                  {socialLoading === 'apple' ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      <span className="font-medium">Continue with Apple</span>
                    </>
                  )}
                </div>
              </div>
            </motion.button>
          </div>

          {/* Info Note */}
          {isSignUp && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
              <p className="text-sm text-slate-400">
                <span className="text-slate-300 font-medium">Important:</span> Your password encrypts your wallet locally. Save your recovery phrase from Settings after creating your account.
              </p>
            </div>
          )}

          {!isSignUp && (
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
              <p className="text-sm text-slate-400">
                <span className="text-slate-300 font-medium">Note:</span> This only works on the device where you created your account. On a new device, use your recovery phrase to restore your wallet.
              </p>
            </div>
          )}
        </motion.form>
      </div>
    </div>
  );
}
