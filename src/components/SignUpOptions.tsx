import { Button } from './ui/button';
import { ArrowLeft, Key, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { GradientButton } from './GradientButton';
import backgroundImage from 'figma:asset/7fff6c0f4086de297821ed0e75fcf92b1f55b37f.png';

interface SignUpOptionsProps {
  onSelectRecoveryPhrase: () => void;
  onSelectEmail: () => void;
  onSelectGoogle: () => void;
  onSelectApple: () => void;
  onBack: () => void;
}

export function SignUpOptions({ onSelectRecoveryPhrase, onSelectEmail, onSelectGoogle, onSelectApple, onBack }: SignUpOptionsProps) {
  return (
    <div 
      className="min-h-screen text-white w-full overflow-y-auto relative"
      style={{
        background: `url(${backgroundImage}) center/cover no-repeat`,
        backgroundColor: '#050510',
      }}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/30" />
      
      <div className="px-6 py-6 w-full pb-20 relative z-10">
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
            className="text-slate-400 hover:text-white hover:bg-slate-900/50 -ml-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>

        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
                {/* Recommended Badge */}
                <div className="absolute top-4 right-4 rounded-full bg-purple-500/20 border border-purple-500/40 px-3 py-1 px-[8px] py-[4px]">
                  <span className="text-xs text-purple-300 font-semibold">Recommended</span>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors">
                    <Key className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1 pr-20">
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
            <motion.div
              className="w-full"
              whileHover={{ scale: 1.01 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all relative overflow-hidden backdrop-blur-sm">
                {/* Coming Soon Banner */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="px-3 py-1.5 bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/40 rounded-full backdrop-blur-sm">
                    <p className="text-purple-300 font-semibold text-xs">Coming Soon</p>
                  </div>
                </div>
                
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Email & Password</h3>
                    <p className="text-xs text-slate-400">
                      Sign up with social or email
                    </p>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="space-y-3 opacity-50 pointer-events-none">
                  {/* Google Button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <button
                      onClick={onSelectGoogle}
                      className="w-full bg-white hover:bg-gray-100 text-black rounded-xl p-4 flex items-center justify-center gap-3 transition-all font-semibold shadow-lg"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </button>
                  </motion.div>

                  {/* Apple Button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <button
                      onClick={onSelectApple}
                      className="w-full bg-black hover:bg-slate-900 text-white border border-slate-700 hover:border-slate-600 rounded-xl p-4 flex items-center justify-center gap-3 transition-all font-semibold"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Continue with Apple
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-950/30 border border-blue-900/40 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-sm text-blue-200/90">
              <span className="text-blue-400 font-semibold">💡 Tip:</span> When you sign up with Google or Apple, we automatically create a recovery phrase for you. You can view and save it later in Settings.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
