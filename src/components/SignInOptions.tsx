import { Button } from './ui/button';
import { ArrowLeft, Key, Mail } from 'lucide-react';
import { motion } from 'motion/react';

interface SignInOptionsProps {
  onSelectRecoveryPhrase: () => void;
  onSelectEmail: () => void;
  onBack: () => void;
}

export function SignInOptions({ onSelectRecoveryPhrase, onSelectEmail, onBack }: SignInOptionsProps) {
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

        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6 text-left hover:border-purple-500/50 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors">
                    <Key className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Recovery Phrase</h3>
                    <p className="text-sm text-slate-400">
                      Sign in with your 12-word secret recovery phrase
                    </p>
                  </div>
                </div>
              </div>
            </motion.button>

            {/* Email Option */}
            <motion.button
              onClick={onSelectEmail}
              className="w-full"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6 text-left hover:border-blue-500/50 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Email & Password</h3>
                    <p className="text-sm text-slate-400">
                      Sign in with your email address and password
                    </p>
                  </div>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Info Box */}
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-4">
            <p className="text-sm text-slate-400">
              <span className="text-slate-300 font-medium">Note:</span> Make sure you use the same method you used to create your wallet.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}