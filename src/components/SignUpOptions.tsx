import { useState } from 'react';
import { Button } from './ui/button';
import { ArrowLeft, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { createSupabaseClient } from '../utils/supabase/client';

interface SignUpOptionsProps {
  onSelectRecoveryPhrase: () => void;
  onBack: () => void;
}

export function SignUpOptions({ onSelectRecoveryPhrase, onBack }: SignUpOptionsProps) {
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    try {
      // Mark intent so OAuth callback knows to create a new wallet
      localStorage.setItem('oauth_intent', 'signup');
      const supabase = createSupabaseClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          // Force account picker so users can choose which Google/Apple account to use
          queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
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
        background: 'linear-gradient(180deg, #08061a 0%, #0a0818 40%, #060510 100%)',
      }}
    >
        {/* Connected dots grid background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <style>{`
            @keyframes suGridPulse { 0%, 100% { opacity: 0.13; } 50% { opacity: 0.2; } }
            @keyframes suGridPulse2 { 0%, 100% { opacity: 0.05; } 50% { opacity: 0.09; } }
            @keyframes suGlowOrbit {
              0% { top: -15%; left: -15%; }
              25% { top: -10%; left: 70%; }
              50% { top: 70%; left: 60%; }
              75% { top: 60%; left: -10%; }
              100% { top: -15%; left: -15%; }
            }
          `}</style>
          {/* Primary network grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><line x1='0' y1='0' x2='50' y2='0' stroke='rgba(139,92,246,1)' stroke-width='0.3'/><line x1='0' y1='0' x2='0' y2='50' stroke='rgba(139,92,246,1)' stroke-width='0.3'/><line x1='0' y1='0' x2='25' y2='25' stroke='rgba(139,92,246,1)' stroke-width='0.2'/><line x1='25' y1='25' x2='50' y2='0' stroke='rgba(139,92,246,1)' stroke-width='0.2'/><line x1='25' y1='25' x2='0' y2='50' stroke='rgba(139,92,246,1)' stroke-width='0.2'/><line x1='25' y1='25' x2='50' y2='50' stroke='rgba(139,92,246,1)' stroke-width='0.2'/><circle cx='0' cy='0' r='1.5' fill='rgba(139,92,246,1)'/><circle cx='25' cy='25' r='1' fill='rgba(139,92,246,0.7)'/></svg>`)}")`,
            animation: 'suGridPulse 6s ease-in-out infinite',
            opacity: 0.13,
          }} />
          {/* Secondary grid — offset for depth */}
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><line x1='0' y1='0' x2='50' y2='0' stroke='rgba(99,102,241,1)' stroke-width='0.2'/><line x1='0' y1='0' x2='0' y2='50' stroke='rgba(99,102,241,1)' stroke-width='0.2'/><circle cx='0' cy='0' r='1' fill='rgba(99,102,241,0.8)'/></svg>`)}")`,
            backgroundSize: '35px 35px',
            backgroundPosition: '17px 17px',
            animation: 'suGridPulse2 9s ease-in-out infinite',
            opacity: 0.05,
          }} />
          {/* Orbiting glow spot */}
          <div className="absolute" style={{ width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'suGlowOrbit 18s ease-in-out infinite' }} />
          {/* Center glow */}
          <div className="absolute" style={{ top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(88,28,135,0.06) 40%, transparent 70%)', filter: 'blur(40px)' }} />
          {/* Fade at top edge */}
          <div className="absolute top-0 left-0 right-0" style={{ height: '12%', background: 'linear-gradient(to bottom, #08061a, transparent)', zIndex: 1 }} />
          {/* Fade at bottom edge */}
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '12%', background: 'linear-gradient(to top, #060510, transparent)', zIndex: 1 }} />
        </div>

        <div
          className="px-6 py-6 w-full relative z-10 flex-1"
          style={{ paddingBottom: 'max(120px, calc(env(safe-area-inset-bottom) + 100px))' }}
        >
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-slate-400 hover:text-white hover:bg-slate-900/50 -ml-2 transition-all h-10 w-10 p-0"
          >
            <ArrowLeft className="!size-6" />
          </Button>
        </div>

        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold">Create New Wallet</h1>
            <p className="text-slate-400 leading-relaxed">
              Choose how you want to create your wallet
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* Recovery Phrase Option - Recommended */}
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
                    <h3 className="font-semibold mb-1">Recovery Phrase</h3>
                    <p className="text-sm text-slate-400">
                      Create wallet with a 12-word secret recovery phrase
                    </p>
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-slate-500">✓ Most secure option</p>
                      <p className="text-xs text-slate-500">✓ Full control of your wallet</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>

            {/* Email & Password Section */}
            <div className="w-full">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all relative overflow-hidden backdrop-blur-sm">
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

                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-950/30 border border-blue-900/40 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-blue-200/90">
              <span className="text-blue-400 font-semibold">💡 Tip:</span> When you sign up with Google or Apple, we automatically create a recovery phrase for you. You can view and save it later in Settings.
            </p>
          </div>
        </div>
        </div>
    </div>
  );
}
