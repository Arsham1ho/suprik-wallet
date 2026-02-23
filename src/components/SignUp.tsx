import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { GradientButton } from './GradientButton';
import { ArrowLeft, Eye, Copy, Check, Fingerprint, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from './ui/card';
import { copyToClipboardWithAutoClear } from '../utils/clipboard';
import { motion, AnimatePresence } from 'motion/react';
import { generateMnemonic, deriveWalletId, SecureStorage, WalletStorage } from '../utils/wallet';
import { useWallet } from '../utils/WalletContext';
import { isBiometricAvailable, registerBiometric, getBiometricTypeName } from '../utils/biometric';
import { saveUserSettings } from '../utils/userSettings';

interface SignUpProps {
  onSuccess: (token: string, walletId: string) => void;
  onBack: () => void;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 12) return 'weak';

  let score = 0;

  // Length bonus
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score >= 6) return 'strong';
  if (score >= 4) return 'medium';
  return 'weak';
}

export function SignUp({ onSuccess, onBack }: SignUpProps) {
  const wallet = useWallet();
  const [step, setStep] = useState<'intro' | 'phrase' | 'password' | 'confirm-password' | 'biometric'>('intro');
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [biometricName, setBiometricName] = useState('Touch ID');

  // Generate mnemonic on mount and check biometric availability
  useEffect(() => {
    generateMnemonic()
      .then(setSeedPhrase)
      .catch((error) => {
        console.error('[SignUp] Failed to generate mnemonic:', error);
        toast.error('Failed to generate wallet. Please refresh and try again.');
      });

    // Check if biometric is available
    isBiometricAvailable().then((available) => {
      setBiometricAvailable(available);
      if (available) {
        setBiometricName(getBiometricTypeName());
        setEnableBiometric(true); // Default to enabled if available
      }
    });
  }, []);

  // Security: Clear sensitive data from state after use
  const clearSensitiveState = () => {
    setSeedPhrase('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleCopy = async () => {
    const success = await copyToClipboardWithAutoClear(seedPhrase);
    if (success) {
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy. Please write down your phrase manually.');
    }
  };

  // Get password strength
  const passwordStrength = getPasswordStrength(password);
  const strengthColors = {
    weak: { bg: 'bg-red-500', text: 'text-red-400', label: 'Weak' },
    medium: { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Medium' },
    strong: { bg: 'bg-green-500', text: 'text-green-400', label: 'Strong' },
  };

  const handleContinue = async (useBiometric?: boolean) => {
    if (step === 'intro') {
      setStep('phrase');
    } else if (step === 'phrase' && saved) {
      setStep('password');
    } else if (step === 'password') {
      if (password.length < 12) {
        toast.error('Password must be at least 12 characters');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        toast.error('Password must include at least one uppercase letter');
        return;
      }
      if (!/[0-9]/.test(password)) {
        toast.error('Password must include at least one number');
        return;
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        toast.error('Password must include at least one special character');
        return;
      }
      setStep('confirm-password');
    } else if (step === 'confirm-password') {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      // If biometric available, go to biometric step, otherwise create wallet
      if (biometricAvailable) {
        setStep('biometric');
      } else {
        await createWallet(false);
      }
    } else if (step === 'biometric') {
      // Use the passed value to avoid React state timing issues
      await createWallet(useBiometric ?? enableBiometric);
    }
  };

  const createWallet = async (shouldEnableBiometric: boolean = false) => {
    setLoading(true);
    try {
      // Derive wallet ID from mnemonic
      const walletId = await deriveWalletId(seedPhrase);

      // ⚡ CRITICAL: Clear any existing account data before creating new wallet
      // This prevents duplicate accounts from previous wallet sessions
      localStorage.removeItem('saturn_accounts');
      localStorage.removeItem('saturn_active_account_id');

      // Encrypt and store mnemonic in localStorage (per-wallet key)
      await SecureStorage.storeMnemonic(seedPhrase, password, walletId);

      // Store wallet ID (unencrypted, just for identification)
      WalletStorage.setWalletId(walletId);
      WalletStorage.setCurrentAccount(0);

      // Generate default username (Phantom style: lowercase)
      const defaultUsername = `@user${walletId.substring(0, 6).toLowerCase()}`;
      localStorage.setItem('saturn_username', defaultUsername);

      // Unlock the wallet immediately after creation
      // This ensures addresses are derived and ready when user lands on Home
      const unlocked = await wallet.unlock(password);

      if (!unlocked) {
        throw new Error('Failed to unlock wallet after creation');
      }

      // Register biometric if user opted in
      if (shouldEnableBiometric && biometricAvailable) {
        const biometricResult = await registerBiometric(walletId);

        if (biometricResult.success) {
          // Save biometric settings to userSettings (correct location)
          saveUserSettings({
            biometricEnabled: true,
            autoLockMinutes: 5,
          }, walletId);

          // Also store the password for biometric unlock (per-wallet key)
          // This is needed so biometric can unlock the wallet
          await WalletStorage.setOAuthPassword(password, walletId);

          toast.success(`Wallet created with ${biometricName} enabled!`);
        } else if (!biometricResult.cancelled) {
          toast.success('Wallet created securely!');
        } else {
          toast.success('Wallet created securely!');
        }
      } else {
        toast.success('Wallet created securely!');
      }

      // Security: Clear sensitive data from state before navigation
      clearSensitiveState();
      onSuccess(walletId, walletId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create wallet');
    } finally {
      setLoading(false);
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
            onClick={() => {
              if (step === 'intro') onBack();
              else if (step === 'phrase') setStep('intro');
              else if (step === 'password') setStep('phrase');
              else if (step === 'confirm-password') setStep('password');
              else if (step === 'biometric') setStep('confirm-password');
            }}
            className="text-slate-400 hover:text-white hover:bg-slate-900 -ml-2 transition-all h-10 w-10 p-0"
          >
            <ArrowLeft className="!size-6" />
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

              <div className="rounded-xl p-4">
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

          {/* Password Step - Enter Password */}
          {step === 'password' && (
            <motion.div
              key="password"
              className="space-y-5"
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

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-lg"
                    placeholder="Enter password (min 12 characters)"
                    autoFocus
                  />
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex gap-1.5">
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        password.length >= 1 ? strengthColors[passwordStrength].bg : 'bg-slate-800'
                      }`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength === 'medium' || passwordStrength === 'strong' ? strengthColors[passwordStrength].bg : 'bg-slate-800'
                      }`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength === 'strong' ? strengthColors[passwordStrength].bg : 'bg-slate-800'
                      }`} />
                    </div>
                    <p className={`text-sm ${strengthColors[passwordStrength].text}`}>
                      Password strength: {strengthColors[passwordStrength].label}
                    </p>
                  </motion.div>
                )}
              </div>

              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-blue-200/90 text-sm leading-relaxed">
                  <strong className="text-blue-400 font-semibold">Tip:</strong> Use a mix of uppercase, lowercase, numbers, and special characters for a stronger password.
                </p>
              </div>

              <GradientButton
                onClick={handleContinue}
                disabled={password.length < 12}
                className="w-full h-12"
              >
                Continue
              </GradientButton>
            </motion.div>
          )}

          {/* Confirm Password Step */}
          {step === 'confirm-password' && (
            <motion.div
              key="confirm-password"
              className="space-y-5"
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Confirm Password</h1>
                <p className="text-slate-400 leading-relaxed">
                  Enter your password again to make sure you remember it.
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800/50 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all text-lg"
                  placeholder="Re-enter your password"
                  autoFocus
                />
              </div>

              {/* Password match indicator */}
              {confirmPassword.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 ${
                    password === confirmPassword ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {password === confirmPassword ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Passwords match</span>
                    </>
                  ) : (
                    <span className="text-sm">Passwords do not match</span>
                  )}
                </motion.div>
              )}

              <div className="rounded-xl p-4">
                <p className="text-amber-200/90 text-sm leading-relaxed">
                  <strong className="text-amber-400 font-semibold">Important:</strong> This password cannot be recovered. Make sure to remember it!
                </p>
              </div>

              <GradientButton
                onClick={handleContinue}
                disabled={!confirmPassword || password !== confirmPassword || loading}
                className="w-full h-12"
              >
                {loading && !biometricAvailable ? 'Creating...' : 'Continue'}
              </GradientButton>
            </motion.div>
          )}

          {/* Biometric Step */}
          {step === 'biometric' && (
            <motion.div
              key="biometric"
              className="space-y-6"
              style={{ paddingTop: '90px' }}
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-2 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4"
                >
                  <Fingerprint className="w-12 h-12 text-purple-400" />
                </motion.div>
                <h1 className="text-3xl font-bold">Enable {biometricName}?</h1>
                <p className="text-slate-400 leading-relaxed">
                  Unlock your wallet quickly and securely using {biometricName}.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Quick Access</p>
                    <p className="text-slate-400 text-sm">Unlock in seconds without typing</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Secure</p>
                    <p className="text-slate-400 text-sm">Your biometric data stays on device</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <GradientButton
                  onClick={() => handleContinue(true)}
                  disabled={loading}
                  className="w-full h-12"
                >
                  {loading ? 'Creating Wallet...' : `Enable ${biometricName}`}
                </GradientButton>

                <Button
                  variant="ghost"
                  onClick={() => handleContinue(false)}
                  disabled={loading}
                  className="w-full h-12 text-slate-400 hover:text-white hover:bg-slate-900/50"
                >
                  Skip for now
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}