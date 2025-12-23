/**
 * Saturn Wallet - Web3 Setup
 * Create or import wallet with client-side encryption
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Copy, Check, Eye, EyeOff, Shield, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { useWeb3Wallet } from '../../contexts/Web3WalletContext';

type SetupStep = 'choice' | 'create-password' | 'show-seed' | 'confirm-seed' | 'import-seed';

export function Web3Setup({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<SetupStep>('choice');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [importSeed, setImportSeed] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedSeed, setCopiedSeed] = useState(false);
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [verifyWords, setVerifyWords] = useState<{ [key: number]: string }>({});
  
  const { createWallet, importWallet, loading } = useWeb3Wallet();
  
  const gradient = 'from-purple-600 to-blue-600';

  const handleCreatePassword = async () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const { seedPhrase: generatedSeed } = await createWallet(password);
      setSeedPhrase(generatedSeed);
      setStep('show-seed');
      toast.success('Wallet created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create wallet');
    }
  };

  const handleImportWallet = async () => {
    if (!importSeed.trim()) {
      toast.error('Please enter your seed phrase');
      return;
    }

    const words = importSeed.trim().split(/\s+/);
    if (words.length !== 12) {
      toast.error('Seed phrase must be exactly 12 words');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await importWallet(importSeed.trim(), password);
      toast.success('Wallet imported successfully!');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to import wallet');
    }
  };

  const copySeedPhrase = () => {
    navigator.clipboard.writeText(seedPhrase);
    setCopiedSeed(true);
    toast.success('Seed phrase copied to clipboard');
    setTimeout(() => setCopiedSeed(false), 2000);
  };

  const downloadSeedPhrase = () => {
    const blob = new Blob([seedPhrase], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'saturn-wallet-seed-phrase.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Seed phrase downloaded');
  };

  const seedWords = seedPhrase.split(' ');
  // Use crypto.getRandomValues for secure shuffling of verification indices
  const getSecureRandomIndices = () => {
    const indices = [2, 5, 8];
    const randomValues = crypto.getRandomValues(new Uint32Array(indices.length));
    // Fisher-Yates shuffle with secure random
    for (let i = indices.length - 1; i > 0; i--) {
      const j = randomValues[i] % (i + 1);
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, 3);
  };
  const randomIndices = getSecureRandomIndices();

  const handleVerify = () => {
    const isCorrect = randomIndices.every(idx => 
      verifyWords[idx]?.toLowerCase().trim() === seedWords[idx]?.toLowerCase()
    );

    if (isCorrect) {
      toast.success('Verification successful!');
      onComplete();
    } else {
      toast.error('Incorrect words. Please try again.');
      setVerifyWords({});
    }
  };

  // Choice Screen
  if (step === 'choice') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} mx-auto mb-4 flex items-center justify-center`}>
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Saturn</h1>
            <p className="text-slate-400">Your Web3 Solana Wallet</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setStep('create-password')}
              className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 h-14 text-lg`}
            >
              Create New Wallet
            </Button>

            <Button
              onClick={() => setStep('import-seed')}
              variant="outline"
              className="w-full h-14 text-lg border-slate-700 hover:bg-slate-900"
            >
              Import Existing Wallet
            </Button>
          </div>

          <Card className="bg-blue-500/10 border-blue-500/30 p-4 mt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Client-Side Security</p>
                <p className="text-blue-300">Your keys never leave your device. Everything is encrypted locally.</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Create Password Screen
  if (step === 'create-password') {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setStep('choice')}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-2xl font-bold mb-2">Create Password</h1>
          <p className="text-slate-400 mb-8">This password encrypts your wallet on this device</p>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 8 characters)"
                  className="pr-10"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Confirm Password</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>

            <Card className="bg-yellow-500/10 border-yellow-500/30 p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <div className="text-sm text-yellow-200">
                  <p className="font-medium mb-1">Important</p>
                  <p>Make sure you remember this password. It cannot be recovered.</p>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleCreatePassword}
              disabled={loading || !password || password !== confirmPassword}
              className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90`}
            >
              {loading ? 'Creating...' : 'Continue'}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show Seed Phrase Screen
  if (step === 'show-seed') {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-2xl font-bold mb-2">Secret Recovery Phrase</h1>
          <p className="text-slate-400 mb-6">Write down these 12 words in order and store them safely</p>

          <Card className="bg-slate-900/50 border-slate-800 p-6 mb-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {seedWords.map((word, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm w-6">{index + 1}.</span>
                  <span className="text-white font-medium">{word}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copySeedPhrase}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                {copiedSeed ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              
              <Button
                onClick={downloadSeedPhrase}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </Card>

          <Card className="bg-red-500/10 border-red-500/30 p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="text-sm text-red-200">
                <p className="font-medium mb-1">Never share your recovery phrase</p>
                <ul className="space-y-1 text-red-300 list-disc list-inside">
                  <li>Anyone with this phrase can access your funds</li>
                  <li>Saturn will never ask for your seed phrase</li>
                  <li>Store it offline in a secure location</li>
                </ul>
              </div>
            </div>
          </Card>

          <div className="flex items-start gap-3 mb-6">
            <input
              type="checkbox"
              id="confirmed"
              checked={confirmedSaved}
              onChange={(e) => setConfirmedSaved(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="confirmed" className="text-sm text-slate-300">
              I have saved my recovery phrase in a safe place
            </label>
          </div>

          <Button
            onClick={() => setStep('confirm-seed')}
            disabled={!confirmedSaved}
            className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90`}
          >
            Continue
          </Button>
        </motion.div>
      </div>
    );
  }

  // Confirm Seed Phrase Screen
  if (step === 'confirm-seed') {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setStep('show-seed')}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-2xl font-bold mb-2">Verify Recovery Phrase</h1>
          <p className="text-slate-400 mb-6">Enter the following words from your recovery phrase</p>

          <div className="space-y-4 mb-6">
            {randomIndices.map((idx) => (
              <div key={idx}>
                <label className="text-sm text-slate-400 mb-2 block">
                  Word #{idx + 1}
                </label>
                <Input
                  value={verifyWords[idx] || ''}
                  onChange={(e) => setVerifyWords({ ...verifyWords, [idx]: e.target.value })}
                  placeholder="Enter word"
                />
              </div>
            ))}
          </div>

          <Button
            onClick={handleVerify}
            disabled={randomIndices.some(idx => !verifyWords[idx])}
            className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90`}
          >
            Verify & Complete
          </Button>
        </motion.div>
      </div>
    );
  }

  // Import Seed Phrase Screen
  if (step === 'import-seed') {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setStep('choice')}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-2xl font-bold mb-2">Import Wallet</h1>
          <p className="text-slate-400 mb-6">Enter your 12-word recovery phrase</p>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Recovery Phrase</label>
              <textarea
                value={importSeed}
                onChange={(e) => setImportSeed(e.target.value)}
                placeholder="word1 word2 word3 ..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white placeholder:text-slate-600 min-h-[100px]"
              />
              <p className="text-xs text-slate-500 mt-2">
                Separate each word with a space
              </p>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 8 characters)"
                  className="pr-10"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Confirm Password</label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>

            <Button
              onClick={handleImportWallet}
              disabled={loading || !importSeed || !password || password !== confirmPassword}
              className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90`}
            >
              {loading ? 'Importing...' : 'Import Wallet'}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
