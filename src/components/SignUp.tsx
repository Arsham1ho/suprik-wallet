import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { GradientButton } from './GradientButton';
import { ArrowLeft, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from './ui/card';
import { copyToClipboard } from '../utils/clipboard';
import { motion, AnimatePresence } from 'motion/react';
import { generateMnemonic, deriveWalletId, SecureStorage, WalletStorage } from '../utils/wallet';
import { useWallet } from '../utils/WalletContext';

interface SignUpProps {
  onSuccess: (token: string, walletId: string) => void;
  onBack: () => void;
}

export function SignUp({ onSuccess, onBack }: SignUpProps) {
  const wallet = useWallet();
  const [step, setStep] = useState<'intro' | 'phrase' | 'password'>('intro');
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate mnemonic on mount
  useEffect(() => {
    generateMnemonic()
      .then(setSeedPhrase)
      .catch((error) => {
        console.error('[SignUp] Failed to generate mnemonic:', error);
        toast.error('Failed to generate wallet. Please refresh and try again.');
      });
  }, []);

  const handleCopy = async () => {
    const success = await copyToClipboard(seedPhrase);
    if (success) {
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy. Please write down your phrase manually.');
    }
  };

  const handleContinue = async () => {
    if (step === 'intro') {
      setStep('phrase');
    } else if (step === 'phrase' && saved) {
      setStep('password');
    } else if (step === 'password') {
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      setLoading(true);
      try {
        // Derive wallet ID from mnemonic
        const walletId = await deriveWalletId(seedPhrase);
        
        // Encrypt and store mnemonic in localStorage
        await SecureStorage.storeMnemonic(seedPhrase, password);
        
        // Store wallet ID (unencrypted, just for identification)
        WalletStorage.setWalletId(walletId);
        WalletStorage.setCurrentAccount(0);
        
        // Generate default username (Phantom style: lowercase)
        const defaultUsername = `@user${walletId.substring(0, 6)}`;
        localStorage.setItem('saturn_username', defaultUsername);
        
        console.log('[SignUp] ✅ Wallet created locally (client-side only)');
        console.log('[SignUp] Wallet ID:', walletId);
        console.log('[SignUp] Default username:', defaultUsername);
        
        // ⚡ IMPORTANT: Unlock the wallet immediately after creation
        // This ensures addresses are derived and ready when user lands on Home
        console.log('[SignUp] 🔓 Auto-unlocking wallet...');
        const unlocked = await wallet.unlock(password);
        
        if (!unlocked) {
          throw new Error('Failed to unlock wallet after creation');
        }
        
        console.log('[SignUp] ✅ Wallet unlocked and addresses derived');
        
        toast.success('Wallet created securely!');
        onSuccess(walletId, walletId);
      } catch (error: any) {
        console.error('[SignUp] Error:', error);
        toast.error(error.message || 'Failed to create wallet');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className="text-white relative px-6 pt-2"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        backgroundColor: '#000000',
        paddingBottom: 'max(120px, calc(env(safe-area-inset-bottom) + 100px))',
      }}
    >
        {/* Header */}
        <motion.div
          className="flex items-center mb-4"
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={step === 'intro' ? onBack : () => setStep(step === 'password' ? 'phrase' : 'intro')}
            className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Intro Step */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              className="space-y-5"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Secret Recovery Phrase</h1>
                <p className="text-slate-400 leading-relaxed">
                  This phrase is the ONLY way to recover your wallet. Do not share it with anyone.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  { num: 1, title: 'Save in password manager', desc: 'Store your recovery phrase securely in a password manager' },
                  { num: 2, title: 'Write it down', desc: 'Store it in a safe place separate from your computer' },
                  { num: 3, title: 'Memorize it', desc: 'This is the most secure option if you can do it' }
                ].map((item) => (
                  <div
                    key={item.num}
                    className="flex gap-3 p-4 bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-xl hover:border-slate-700/50 transition-all duration-300"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center shrink-0 mt-1">
                      <span className="text-purple-400 font-semibold">{item.num}</span>
                    </div>
                    <div>
                      <h3 className="text-white mb-1 font-semibold">{item.title}</h3>
                      <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-amber-200/90 text-sm leading-relaxed">
                  <strong className="text-amber-400 font-semibold">Warning:</strong> Suprik cannot recover your wallet if you lose your secret recovery phrase.
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GradientButton
                  onClick={handleContinue}
                  className="w-full h-12"
                >
                  Continue
                </GradientButton>
              </motion.div>
            </motion.div>
          )}

          {/* Phrase Step */}
          {step === 'phrase' && (
            <motion.div
              key="phrase"
              className="space-y-2"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">Write Down Your Secret Recovery Phrase</h1>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Write down this 12-word phrase and save it in a safe place.
                </p>
              </div>

              <Card className="bg-slate-950/50 backdrop-blur-sm border-slate-800/50 p-3 relative overflow-hidden">
                {!revealed && (
                  <div className="absolute inset-0 backdrop-blur-lg bg-slate-950/60 rounded-lg flex items-center justify-center z-10">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => setRevealed(true)}
                        variant="outline"
                        className="border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-sm transition-all font-semibold shadow-lg"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Reveal Secret Words
                      </Button>
                    </motion.div>
                  </div>
                )}

                <div className={`grid grid-cols-2 gap-2 ${!revealed ? 'blur-sm' : ''}`}>
                  {seedPhrase.split(' ').map((word, index) => (
                    <div
                      key={index}
                      className="bg-black/50 border border-slate-800/50 rounded-lg px-2 py-2 flex items-center gap-2 hover:border-slate-700/50 transition-all"
                    >
                      <span className="text-slate-600 text-xs w-4 font-semibold">{index + 1}</span>
                      <span className="text-white text-sm font-medium">{word}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {revealed && (
                <div className="space-y-2">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="w-full h-10 border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 text-white backdrop-blur-sm transition-all font-semibold text-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>

                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-950/30 transition-all">
                    <input
                      type="checkbox"
                      id="saved"
                      checked={saved}
                      onChange={(e) => setSaved(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer transition-all"
                    />
                    <label htmlFor="saved" className="text-slate-300 text-sm cursor-pointer">
                      I saved my secret recovery phrase
                    </label>
                  </div>

                  <GradientButton
                    onClick={handleContinue}
                    disabled={!saved || loading}
                    className="w-full h-11"
                  >
                    {loading ? 'Creating...' : 'Continue'}
                  </GradientButton>
                </div>
              )}
            </motion.div>
          )}

          {/* Password Step */}
          {step === 'password' && (
            <motion.div
              key="password"
              className="space-y-4"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Create Password</h1>
                <p className="text-slate-400 leading-relaxed">
                  This password encrypts your wallet on this device. You'll need it to unlock Suprik.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="Enter password (min 8 characters)"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="Confirm password"
                  />
                </div>
              </div>

              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-blue-200/90 text-sm leading-relaxed">
                  <strong className="text-blue-400 font-semibold">Note:</strong> This password is stored locally and cannot be recovered. Make sure to remember it!
                </p>
              </div>

              <GradientButton
                onClick={handleContinue}
                disabled={!password || !confirmPassword || loading}
                className="w-full h-12"
              >
                {loading ? 'Creating...' : 'Create Wallet'}
              </GradientButton>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}