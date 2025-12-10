import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { GradientButton } from './GradientButton';
import { ArrowLeft, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { motion } from 'motion/react';

interface EmailVerificationProps {
  email: string;
  password: string;
  isSignUp: boolean;
  onSuccess: (token: string, walletId: string) => void;
  onBack: () => void;
}

export function EmailVerification({ 
  email, 
  password, 
  isSignUp, 
  onSuccess, 
  onBack 
}: EmailVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send verification code on mount
  useEffect(() => {
    sendVerificationCode();
  }, []);

  const sendVerificationCode = async () => {
    setResending(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/send-verification-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      // Check if in demo mode
      if (data.demoMode && data.code) {
        setDemoMode(true);
        setDemoCode(data.code);
        toast.success('🧪 DEMO MODE: Check below for verification code', {
          duration: 10000,
        });
      } else {
        setDemoMode(false);
        toast.success('Verification code sent to your email!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification code', {
        duration: 6000,
      });
    } finally {
      setResending(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      
      // Focus last filled input or last input
      const lastFilledIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[lastFilledIndex]?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return; // Only numbers

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignUp ? 'verify-email-signup' : 'verify-email-signin';
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ 
            email, 
            password, 
            code: verificationCode 
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      toast.success(isSignUp ? 'Account created successfully!' : 'Welcome back!');
      onSuccess(data.walletId, data.walletId);
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
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
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-bold">
              Verify Your Email
            </h1>
            <p className="text-slate-400 leading-relaxed">
              We sent a 6-digit code to<br />
              <span className="text-white font-medium">{email}</span>
            </p>
          </div>

          {/* Code Input */}
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 bg-slate-950/50 border border-slate-800/50 rounded-xl text-center text-xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Demo Mode Alert */}
          {demoMode && demoCode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🧪</span>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-amber-200">
                    <strong>DEMO MODE</strong> - Email service is in testing
                  </p>
                  <div className="bg-black/30 rounded-lg p-3 border border-amber-500/20">
                    <p className="text-xs text-amber-300/80 mb-1">Your verification code:</p>
                    <p className="text-2xl font-mono font-bold text-amber-400 tracking-widest text-center">
                      {demoCode}
                    </p>
                  </div>
                  <p className="text-xs text-amber-300/60">
                    Copy this code and paste it above
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Verify Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <GradientButton
              onClick={handleVerify}
              disabled={loading || code.some(d => !d)}
              className="w-full h-12"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </GradientButton>
          </motion.div>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Didn't receive the code?{' '}
              <button
                onClick={sendVerificationCode}
                disabled={resending}
                className="text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
              >
                {resending ? 'Sending...' : 'Resend'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}