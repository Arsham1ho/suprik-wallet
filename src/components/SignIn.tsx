import React, { useState } from 'react';
import { Button } from './ui/button';
import { GradientButton } from './GradientButton';
import { ArrowLeft, Key, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { validateMnemonic, deriveWalletId, SecureStorage, WalletStorage } from '../utils/wallet';
import { Card } from './ui/card';
import { useWallet } from '../utils/WalletContext';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';

interface SignInProps {
  onSuccess: (token: string, walletId: string) => void;
  onBack: () => void;
}

export function SignIn({ onSuccess, onBack }: SignInProps) {
  const wallet = useWallet();
  const [importMode, setImportMode] = useState<'select' | 'mnemonic' | 'privateKey'>('select');
  const [step, setStep] = useState<'input' | 'password'>('input');
  const [words, setWords] = useState<string[]>(Array(12).fill(''));
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [derivedPublicKey, setDerivedPublicKey] = useState('');

  // Validate and parse private key (supports base58 and array formats)
  const parsePrivateKey = (input: string): Uint8Array | null => {
    try {
      const trimmed = input.trim();

      // Try parsing as JSON array first (e.g., [1,2,3,...])
      if (trimmed.startsWith('[')) {
        const arr = JSON.parse(trimmed);
        if (Array.isArray(arr) && arr.length === 64) {
          return new Uint8Array(arr);
        }
      }

      // Try parsing as base58 encoded string
      const decoded = bs58.decode(trimmed);
      if (decoded.length === 64) {
        return decoded;
      }

      return null;
    } catch {
      return null;
    }
  };

  const handlePrivateKeyChange = (value: string) => {
    setPrivateKey(value);
    setDerivedPublicKey('');

    const secretKey = parsePrivateKey(value);
    if (secretKey) {
      try {
        const keypair = Keypair.fromSecretKey(secretKey);
        setDerivedPublicKey(keypair.publicKey.toBase58());
      } catch {
        setDerivedPublicKey('');
      }
    }
  };

  const handlePrivateKeyContinue = () => {
    const secretKey = parsePrivateKey(privateKey);
    if (!secretKey) {
      toast.error('Invalid private key format');
      return;
    }

    try {
      Keypair.fromSecretKey(secretKey);
      setStep('password');
    } catch {
      toast.error('Invalid private key');
    }
  };

  const handlePrivateKeyImport = async () => {
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const secretKey = parsePrivateKey(privateKey);
      if (!secretKey) {
        throw new Error('Invalid private key');
      }

      const keypair = Keypair.fromSecretKey(secretKey);
      const publicKey = keypair.publicKey.toBase58();

      // Use public key as wallet ID for private key imports
      const walletId = publicKey.substring(0, 16);

      // ⚡ CRITICAL: Clear any existing account data before importing wallet
      // This prevents duplicate accounts from previous wallet sessions
      localStorage.removeItem('saturn_accounts');
      localStorage.removeItem('saturn_active_account_id');

      // Store the private key encrypted (we'll store it as a special format)
      // For private key imports, we store the base58 encoded secret key
      const privateKeyBase58 = bs58.encode(secretKey);
      await SecureStorage.storeMnemonic(`PRIVKEY:${privateKeyBase58}`, password);

      // Store wallet ID
      WalletStorage.setWalletId(walletId);
      WalletStorage.setCurrentAccount(0);

      // Store the public key directly since we can't derive it from a mnemonic
      localStorage.setItem('saturn_imported_pubkey', publicKey);
      localStorage.setItem('saturn_import_type', 'privateKey');

      // Generate default username
      const existingUsername = localStorage.getItem('saturn_username');
      if (!existingUsername) {
        const defaultUsername = `@user${walletId.substring(0, 6)}`;
        localStorage.setItem('saturn_username', defaultUsername);
      }

      console.log('[SignIn] ✅ Wallet imported from private key');
      console.log('[SignIn] Public Key:', publicKey);

      // Unlock wallet
      const unlocked = await wallet.unlock(password);
      if (!unlocked) {
        throw new Error('Failed to unlock wallet after import');
      }

      toast.success('Wallet imported successfully!');
      onSuccess(walletId, walletId);
    } catch (error: any) {
      console.error('[SignIn] Private key import error:', error);
      toast.error(error.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

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

      // ⚡ CRITICAL: Clear any existing account data before importing wallet
      // This prevents duplicate accounts from previous wallet sessions
      localStorage.removeItem('saturn_accounts');
      localStorage.removeItem('saturn_active_account_id');

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

  const handleBack = () => {
    if (step === 'password') {
      setStep('input');
      setPassword('');
    } else if (importMode !== 'select') {
      setImportMode('select');
      setPrivateKey('');
      setDerivedPublicKey('');
      setWords(Array(12).fill(''));
    } else {
      onBack();
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
            onClick={handleBack}
            className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Import Method Selection */}
          {importMode === 'select' && step === 'input' && (
            <motion.div
              key="select"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">Import Wallet</h1>
                <p className="text-slate-400 leading-relaxed">
                  Choose how you want to import your existing wallet.
                </p>
              </div>

              <div className="space-y-3">
                <motion.button
                  onClick={() => setImportMode('mnemonic')}
                  className="w-full bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-5 text-left hover:border-purple-500/50 transition-all group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">Recovery Phrase</h3>
                      <p className="text-sm text-slate-400">
                        Import using your 12-word secret recovery phrase (BIP-39)
                      </p>
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setImportMode('privateKey')}
                  className="w-full bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-5 text-left hover:border-purple-500/50 transition-all group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Key className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">Private Key</h3>
                      <p className="text-sm text-slate-400">
                        Import using your Solana private key (base58 or byte array)
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Mnemonic Input Step */}
          {importMode === 'mnemonic' && step === 'input' && (
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

          {/* Private Key Input Step */}
          {importMode === 'privateKey' && step === 'input' && (
            <motion.div
              key="privateKey"
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-3">
                <h1 className="text-3xl font-bold">Import Private Key</h1>
                <p className="text-slate-400 leading-relaxed">
                  Enter your Solana private key to import your wallet.
                </p>
              </div>

              <Card className="bg-slate-950/50 backdrop-blur-sm border-slate-800/50 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Private Key</label>
                    <textarea
                      value={privateKey}
                      onChange={(e) => handlePrivateKeyChange(e.target.value)}
                      className="w-full bg-black/50 border border-slate-800/50 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono resize-none"
                      placeholder="Paste your private key (base58 or byte array)"
                      rows={3}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  {derivedPublicKey && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-950/30 border border-green-900/30 rounded-lg p-3"
                    >
                      <p className="text-xs text-green-400 mb-1">Wallet Address:</p>
                      <p className="text-sm text-green-200 font-mono break-all">{derivedPublicKey}</p>
                    </motion.div>
                  )}

                  <p className="text-slate-500 text-xs">
                    Supports base58 encoded keys or JSON byte arrays [1,2,3,...]
                  </p>
                </div>
              </Card>

              <motion.div
                className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-amber-200/90 text-sm leading-relaxed">
                  <strong className="text-amber-400 font-semibold">Warning:</strong> Never share your private key. Anyone with your private key can access your funds.
                </p>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GradientButton
                  onClick={handlePrivateKeyContinue}
                  disabled={!derivedPublicKey}
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

              {/* Show derived address for private key import */}
              {importMode === 'privateKey' && derivedPublicKey && (
                <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800/50 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Importing wallet:</p>
                  <p className="text-sm text-white font-mono break-all">{derivedPublicKey}</p>
                </div>
              )}

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
                  onClick={importMode === 'privateKey' ? handlePrivateKeyImport : handleImport}
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