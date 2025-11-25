import { useState } from 'react';
import { Button } from './ui/button';
import { GradientButton } from './GradientButton';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import { validateMnemonic, deriveWalletId, SecureStorage, WalletStorage } from '../utils/wallet';
import { Card } from './ui/card';
import { useWallet } from '../utils/WalletContext';

interface SignInProps {
  onSuccess: (token: string, walletId: string) => void;
  onBack: () => void;
}

export function SignIn({ onSuccess, onBack }: SignInProps) {
  const wallet = useWallet();
  const [step, setStep] = useState<'mnemonic' | 'password'>('mnemonic');
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mnemonic, setMnemonic] = useState('');

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value.trim().toLowerCase();
    setWords(newWords);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedWords = pastedText.trim().split(/\s+/);
    
    if (pastedWords.length === 12) {
      setWords(pastedWords.map(w => w.toLowerCase()));
      toast.success('Recovery phrase pasted');
    } else {
      toast.error('Please paste a 12-word recovery phrase');
    }
  };

  const handleContinueToPassword = () => {
    const filledWords = words.filter(w => w.length > 0);
    if (filledWords.length !== 12) {
      toast.error('Please enter all 12 words');
      return;
    }

    const mnemonicString = words.join(' ');
    
    if (!validateMnemonic(mnemonicString)) {
      toast.error('Invalid recovery phrase');
      return;
    }

    setMnemonic(mnemonicString);
    setStep('password');
  };

  const handleImport = async () => {
    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      // Derive wallet ID from mnemonic
      const walletId = await deriveWalletId(mnemonic);
      
      // Encrypt and store mnemonic in localStorage
      await SecureStorage.storeMnemonic(mnemonic, password);
      
      // Store wallet ID
      WalletStorage.setWalletId(walletId);
      WalletStorage.setCurrentAccount(0);
      
      // Generate default username if not exists (Phantom style: lowercase)
      const existingUsername = localStorage.getItem('saturn_username');
      if (!existingUsername) {
        const defaultUsername = `@user${walletId.substring(0, 6)}`;
        localStorage.setItem('saturn_username', defaultUsername);
        console.log('[SignIn] Generated default username:', defaultUsername);
      }
      
      console.log('[SignIn] ✅ Wallet restored locally (client-side only)');
      console.log('[SignIn] Wallet ID:', walletId);
      
      // ⚡ IMPORTANT: Unlock the wallet immediately after import
      // This ensures addresses are derived and ready when user lands on Home
      console.log('[SignIn] 🔓 Auto-unlocking wallet...');
      const unlocked = await wallet.unlock(password);
      
      if (!unlocked) {
        throw new Error('Failed to unlock wallet after import');
      }
      
      console.log('[SignIn] ✅ Wallet unlocked and addresses derived');

      toast.success('Welcome back!');
      onSuccess(walletId, walletId);
    } catch (error: any) {
      console.error('[SignIn] Error:', error);
      toast.error(error.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white w-full">
      <div className="px-6 py-6 w-full">
        {/* Header */}
        <motion.div 
          className="flex items-center mb-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={step === 'mnemonic' ? onBack : () => setStep('mnemonic')}
            className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Mnemonic Step */}
          {step === 'mnemonic' && (
            <motion.div 
              key="mnemonic"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">Import Wallet</h1>
                <p className="text-slate-400 leading-relaxed">
                  Enter your 12-word secret recovery phrase to restore your wallet.
                </p>
              </div>

              <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-6">
                <div className="grid grid-cols-2 gap-3" onPaste={handlePaste}>
                  {words.map((word, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <span className="text-slate-600 text-sm w-5 font-semibold">{index + 1}</span>
                      <input
                        type="text"
                        value={word}
                        onChange={(e) => handleWordChange(index, e.target.value)}
                        className="flex-1 min-w-0 bg-black/50 border border-slate-800/50 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium placeholder:text-slate-600"
                        placeholder="word"
                        autoComplete="off"
                      />
                    </motion.div>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-4">
                  Paste your entire phrase or type each word
                </p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GradientButton
                  onClick={handleContinueToPassword}
                  disabled={words.filter(w => w.length > 0).length !== 12}
                  className="w-full h-12"
                >
                  Continue
                </GradientButton>
              </motion.div>
            </motion.div>
          )}

          {/* Password Step */}
          {step === 'password' && (
            <motion.div 
              key="password"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">Create Password</h1>
                <p className="text-slate-400 leading-relaxed">
                  Set a password to secure your imported wallet on this device.
                </p>
              </div>

              <Card className="bg-slate-950/50 backdrop-blur-sm border-slate-800/50 p-6">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    placeholder="Enter password (min 8 characters)"
                    autoFocus
                  />
                </div>
              </Card>

              <motion.div 
                className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-blue-200/90 text-sm leading-relaxed">
                  <strong className="text-blue-400 font-semibold">Note:</strong> This password will encrypt your wallet on this device.
                </p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GradientButton
                  onClick={handleImport}
                  disabled={!password || password.length < 8 || loading}
                  className="w-full h-12"
                >
                  {loading ? 'Importing...' : 'Import Wallet'}
                </GradientButton>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}