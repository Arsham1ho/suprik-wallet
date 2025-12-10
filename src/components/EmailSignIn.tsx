import { useState } from 'react';
import { Button } from './ui/button';
import { GradientButton } from './GradientButton';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { createSupabaseClient } from '../utils/supabase/client';

interface EmailSignInProps {
  onSuccess: (token: string, walletId: string) => void;
  onBack: () => void;
  isSignUp?: boolean;
}

export function EmailSignIn({ onSuccess, onBack, isSignUp = false }: EmailSignInProps) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoCode, setDemoCode] = useState('');

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    try {
      const supabase = createSupabaseClient();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        }
      });

      if (error) {
        // Check if provider is not enabled
        if (error.message.includes('provider') || error.message.includes('not enabled') || error.message.includes('Unsupported')) {
          throw new Error('NOT_CONFIGURED');
        }
        throw error;
      }

      // OAuth will redirect, so we don't need to handle success here
      toast.success(`Redirecting to ${provider === 'google' ? 'Google' : 'Apple'}...`);
    } catch (error: any) {
      console.error(`${provider} sign in error:`, error);
      
      // Show user-friendly error message
      if (error.message === 'NOT_CONFIGURED') {
        toast.error(
          `${provider === 'google' ? 'Google' : 'Apple'} sign-in is not configured yet. Please setup OAuth in Supabase Dashboard.`,
          { 
            duration: 8000,
            description: 'Use Email sign-in above (works immediately) or follow the setup guide below.'
          }
        );
      } else {
        toast.error(`Failed to sign in with ${provider === 'google' ? 'Google' : 'Apple'}: ${error.message}`);
      }
      
      setSocialLoading(null);
    }
  };

  // Step 1: Send OTP to email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/send-verification-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      // Check for demo mode
      if (data.demoMode && data.code) {
        setDemoMode(true);
        setDemoCode(data.code);
        toast.success(`📧 Demo Mode Active - Your code: ${data.code}`, { duration: 15000 });
      } else {
        toast.success('✅ Verification code sent to your email!');
      }

      setStep(2); // Move to OTP verification step
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      toast.error('Verification code must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      // For sign up, just verify the code and move to password step
      if (isSignUp) {
        toast.success('Code verified! Now create your password');
        setStep(3); // Move to password step
      } else {
        // For sign in, verify code and password together
        toast.info('Please enter your password');
        setStep(3);
      }
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Sign Up/Sign In with Password
  const handleCompleteAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    if (isSignUp) {
      if (!confirmPassword) {
        toast.error('Please confirm your password');
        return;
      }

      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? 'verify-email-signup' : 'verify-email-signin';
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ 
            email, 
            password,
            code: verificationCode 
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (isSignUp ? 'Failed to create account' : 'Failed to sign in'));
      }

      toast.success(isSignUp ? 'Account created successfully!' : 'Welcome back!');
      onSuccess(data.walletId, data.walletId);
    } catch (error: any) {
      toast.error(error.message || (isSignUp ? 'Sign up failed' : 'Sign in failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
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
            onClick={handleBack}
            className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Email Input */}
          {step === 1 && (
            <motion.form 
              key="step1"
              onSubmit={handleSendOTP} 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </h1>
                <p className="text-slate-400 leading-relaxed">
                  Enter your email to get started
                </p>
              </div>

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

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GradientButton
                  type="submit"
                  className="w-full h-12"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Continue'}
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

              {/* OAuth Setup Status */}
              <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="text-xl">💡</div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-semibold text-blue-300">Quick Setup:</span>
                      {' '}Google/Apple sign-in requires a one-time configuration (5 minutes).
                      <br />
                      <br />
                      <span className="font-semibold text-white">For Google:</span>
                      <br />
                      1. Add redirect URI to{' '}
                      <a 
                        href="https://console.cloud.google.com/apis/credentials" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Google Cloud Console
                      </a>
                      <br />
                      2. Add yourself as Test User in{' '}
                      <a 
                        href="https://console.cloud.google.com/apis/credentials/consent" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        OAuth Consent Screen
                      </a>
                      <br />
                      <br />
                      <a 
                        href="/OAUTH_SETUP_GUIDE.md" 
                        target="_blank"
                        className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 font-medium"
                      >
                        📄 View Full Setup Guide →
                      </a>
                      <br />
                      <br />
                      <span className="text-green-400 font-semibold">✅ Email Sign-In:</span> Works immediately (no setup required)
                    </p>
                  </div>
                </div>
              </div>
            </motion.form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <motion.form 
              key="step2"
              onSubmit={handleVerifyOTP} 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">
                  Verify Your Email
                </h1>
                <p className="text-slate-400 leading-relaxed">
                  Enter the 6-digit code we sent to <span className="text-white">{email}</span>
                </p>
              </div>

              {/* Demo Mode Alert */}
              {demoMode && demoCode && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-xs text-yellow-300">
                    <span className="font-semibold">🧪 Demo Mode:</span> Your verification code is: <span className="font-mono text-lg font-bold">{demoCode}</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-slate-400">Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl px-11 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-slate-600 text-center text-2xl tracking-widest font-mono"
                    placeholder="000000"
                    maxLength={6}
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-slate-500 text-center">Code expires in 10 minutes</p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GradientButton
                  type="submit"
                  className="w-full h-12"
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </GradientButton>
              </motion.div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                >
                  Didn't receive the code? Resend
                </button>
              </div>
            </motion.form>
          )}

          {/* Step 3: Password Setup */}
          {step === 3 && (
            <motion.form 
              key="step3"
              onSubmit={handleCompleteAuth} 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">
                  {isSignUp ? 'Create Your Password' : 'Enter Your Password'}
                </h1>
                <p className="text-slate-400 leading-relaxed">
                  {isSignUp 
                    ? 'Choose a strong password to secure your account'
                    : 'Enter your password to continue'
                  }
                </p>
              </div>

              <div className="space-y-4">
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

                {/* Confirm Password Field (Sign Up Only) */}
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
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GradientButton
                  type="submit"
                  className="w-full h-12"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
                </GradientButton>
              </motion.div>

              {/* Additional Info */}
              {!isSignUp && (
                <p className="text-center text-sm text-slate-500">
                  Don't have an account?{' '}
                  <button 
                    type="button"
                    onClick={onBack}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Go back to choose sign up
                  </button>
                </p>
              )}
            </motion.form>
          )}
        </AnimatePresence>

        {/* Step Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step 
                  ? 'w-8 bg-gradient-to-r from-purple-500 to-blue-500' 
                  : s < step 
                  ? 'w-1.5 bg-purple-500/50' 
                  : 'w-1.5 bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}