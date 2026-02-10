import { useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Key, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { createSupabaseClient } from '../utils/supabase/client';
import backgroundImage from 'figma:asset/7fff6c0f4086de297821ed0e75fcf92b1f55b37f.png';

interface SignInOptionsProps {
  onSelectRecoveryPhrase: () => void;
  onSelectEmail: () => void;
  onBack: () => void;
}

export function SignInOptions({ onSelectRecoveryPhrase, onSelectEmail, onBack }: SignInOptionsProps) {
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
          `${provider === 'google' ? 'Google' : 'Apple'} sign-in is not yet configured. Please use another method.`,
          { duration: 5000 }
        );
      } else {
        toast.error(`Failed to sign in with ${provider === 'google' ? 'Google' : 'Apple'}: ${error.message}`);
      }
      setSocialLoading(null);
    }
  };

  return (
    <div
      className="text-white relative select-none flex flex-col"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#050510',
      }}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/30" />

      <div
        className="px-6 py-6 w-full relative z-10 flex-1"
        style={{ paddingBottom: 'max(120px, calc(env(safe-area-inset-bottom) + 100px))' }}
      >
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-900/50 -ml-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Sign In</h1>
            <p className="text-slate-400 leading-relaxed">
              Choose how you want to access your wallet
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* Recovery Phrase Option */}
            <motion.button
              onClick={onSelectRecoveryPhrase}
              className="w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6 text-left hover:border-purple-500/50 transition-all group relative overflow-hidden backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors">
                    <Key className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Recovery Phrase / Private Key</h3>
                    <p className="text-sm text-slate-400">
                      Sign in with your 12-word secret recovery phrase or private key
                    </p>
                  </div>
                </div>
              </div>
            </motion.button>

            {/* Social & Email Section */}
            <div className="w-full">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all relative overflow-hidden backdrop-blur-sm">
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Email & Password</h3>
                    <p className="text-xs text-slate-400">
                      Sign in with social or email
                    </p>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3">
                  {/* Google Button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <button
                      onClick={() => handleSocialSignIn('google')}
                      disabled={socialLoading !== null}
                      className="w-full bg-white hover:bg-gray-100 text-black rounded-xl p-4 flex items-center justify-center gap-3 transition-all font-semibold shadow-lg disabled:opacity-50"
                    >
                      {socialLoading === 'google' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </>
                      )}
                    </button>
                  </motion.div>

                  {/* Apple Button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <button
                      onClick={() => handleSocialSignIn('apple')}
                      disabled={socialLoading !== null}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 hover:border-slate-500 rounded-xl p-4 flex items-center justify-center gap-3 transition-all font-semibold disabled:opacity-50"
                    >
                      {socialLoading === 'apple' ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                          </svg>
                          Continue with Apple
                        </>
                      )}
                    </button>
                  </motion.div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-slate-700/50"></div>
                    <span className="text-xs text-slate-500">or</span>
                    <div className="flex-1 h-px bg-slate-700/50"></div>
                  </div>

                  {/* Email Button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <button
                      onClick={onSelectEmail}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl p-4 flex items-center justify-center gap-3 transition-all font-semibold"
                    >
                      <Mail className="w-5 h-5" />
                      Continue with Email
                    </button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-slate-400">
              <span className="text-slate-300 font-medium">Note:</span> Make sure you use the same method you used to create your wallet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
