import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { GradientButton } from './GradientButton';
import { Check, Fingerprint, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { SecureStorage, WalletStorage } from '../utils/wallet';
import { useWallet } from '../utils/WalletContext';
import { isBiometricAvailable, registerBiometric, getBiometricTypeName } from '../utils/biometric';
import { saveUserSettings } from '../utils/userSettings';

interface SetupPasswordProps {
  walletId: string;
  onComplete: () => void;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 12) return 'weak';

  let score = 0;

  // Length bonus
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score >= 6) return 'strong';
  if (score >= 4) return 'medium';
  return 'weak';
}

export function SetupPassword({ walletId, onComplete }: SetupPasswordProps) {
  const wallet = useWallet();
  const [step, setStep] = useState<'password' | 'confirm-password' | 'biometric'>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState('Touch ID');

  useEffect(() => {
    isBiometricAvailable().then((available) => {
      setBiometricAvailable(available);
      if (available) {
        setBiometricName(getBiometricTypeName());
      }
    });
  }, []);

  const passwordStrength = getPasswordStrength(password);
  const strengthColors = {
    weak: { bg: 'bg-red-500', text: 'text-red-400', label: 'Weak' },
    medium: { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Medium' },
    strong: { bg: 'bg-green-500', text: 'text-green-400', label: 'Strong' },
  };

  const handleContinue = async (useBiometric?: boolean) => {
    if (step === 'password') {
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
      if (biometricAvailable) {
        setStep('biometric');
      } else {
        await finalizePassword(false);
      }
    } else if (step === 'biometric') {
      await finalizePassword(useBiometric ?? false);
    }
  };

  const finalizePassword = async (shouldEnableBiometric: boolean) => {
    setLoading(true);
    try {
      // Get the temporary OAuth password to decrypt the mnemonic
      const oauthPassword = await WalletStorage.getOAuthPassword();
      if (!oauthPassword) {
        throw new Error('Failed to retrieve wallet data');
      }

      // Decrypt mnemonic with the temporary OAuth password
      const mnemonic = await SecureStorage.retrieveMnemonic(oauthPassword);
      if (!mnemonic) {
        throw new Error('Failed to decrypt wallet');
      }

      // Re-encrypt with the user's chosen password
      await SecureStorage.storeMnemonic(mnemonic, password);

      // Store the user's password for auto-unlock on future OAuth sign-ins.
      // This replaces the temporary random password so UnlockWallet can
      // seamlessly unlock the wallet when the user signs in with Google/Apple.
      await WalletStorage.setOAuthPassword(password);

      // Unlock wallet with the new password
      const unlocked = await wallet.unlock(password);
      if (!unlocked) {
        throw new Error('Failed to unlock wallet');
      }

      // Register biometric if user opted in
      if (shouldEnableBiometric && biometricAvailable) {
        const biometricResult = await registerBiometric(walletId);

        if (biometricResult.success) {
          saveUserSettings({
            biometricEnabled: true,
            autoLockMinutes: 5,
          }, walletId);

          toast.success(`Password set with ${biometricName} enabled!`);
        } else if (!biometricResult.cancelled) {
          toast.success('Password set! Your wallet is secured.');
        } else {
          toast.success('Password set! Your wallet is secured.');
        }
      } else {
        toast.success('Password set! Your wallet is secured.');
      }

      // Mark password setup as complete so returning OAuth sign-ins
      // don't bypass this step
      localStorage.setItem(`${walletId}_password_setup_complete`, 'true');

      // Clear sensitive state
      setPassword('');
      setConfirmPassword('');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to set password');
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
        background: 'black',
      }}
    >
      {/* Password Step */}
      {step === 'password' && (
        <div className="space-y-5" style={{ paddingTop: '90px' }}>
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
              <div className="space-y-2">
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
              </div>
            )}
          </div>

          <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4">
            <p className="text-blue-200/90 text-sm leading-relaxed">
              <strong className="text-blue-400 font-semibold">Tip:</strong> Use a mix of uppercase, lowercase, numbers, and special characters for a stronger password.
            </p>
          </div>

          <GradientButton
            onClick={() => handleContinue()}
            disabled={password.length < 12}
            className="w-full h-12"
          >
            Continue
          </GradientButton>
        </div>
      )}

      {/* Confirm Password Step */}
      {step === 'confirm-password' && (
        <div className="space-y-5" style={{ paddingTop: '90px' }}>
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
            <div className={`flex items-center gap-2 ${
              password === confirmPassword ? 'text-green-400' : 'text-red-400'
            }`}>
              {password === confirmPassword ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Passwords match</span>
                </>
              ) : (
                <span className="text-sm">Passwords do not match</span>
              )}
            </div>
          )}

          <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4">
            <p className="text-amber-200/90 text-sm leading-relaxed">
              <strong className="text-amber-400 font-semibold">Important:</strong> This password cannot be recovered. Make sure to remember it!
            </p>
          </div>

          <GradientButton
            onClick={() => handleContinue()}
            disabled={!confirmPassword || password !== confirmPassword || loading}
            className="w-full h-12"
          >
            {loading && !biometricAvailable ? 'Setting up...' : 'Continue'}
          </GradientButton>
        </div>
      )}

      {/* Biometric Step */}
      {step === 'biometric' && (
        <div className="space-y-6" style={{ paddingTop: '90px' }}>
          <div className="space-y-2 text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
              <Fingerprint className="w-12 h-12 text-purple-400" />
            </div>
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
              {loading ? 'Setting up...' : `Enable ${biometricName}`}
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
        </div>
      )}
    </div>
  );
}
