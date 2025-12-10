/**
 * Saturn Wallet - Unlock Screen
 * Password entry to unlock encrypted wallet
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { useWeb3Wallet } from '../../contexts/Web3WalletContext';

interface UnlockWalletProps {
  walletId: string;
  onUnlock: () => void;
  onBack: () => void;
}

export function UnlockWallet({ walletId, onUnlock, onBack }: UnlockWalletProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  
  const { unlockWallet, loading } = useWeb3Wallet();
  const gradient = 'from-purple-600 to-blue-600';

  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime(prev => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handleUnlock = async () => {
    if (lockoutTime > 0) {
      toast.error(`Please wait ${lockoutTime} seconds`);
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    try {
      const success = await unlockWallet(walletId, password);
      
      if (success) {
        toast.success('Wallet unlocked!');
        setPassword('');
        setAttempts(0);
        onUnlock();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setLockoutTime(30);
          toast.error('Too many attempts. Please wait 30 seconds.');
        } else {
          toast.error(`Incorrect password. ${3 - newAttempts} attempts remaining.`);
        }
        
        setPassword('');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to unlock wallet');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && lockoutTime === 0) {
      handleUnlock();
    }
  };

  const shortWalletId = `${walletId.slice(0, 4)}...${walletId.slice(-4)}`;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} mx-auto mb-4 flex items-center justify-center`}>
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-slate-400">Unlock your Saturn Wallet</p>
          <p className="text-sm text-slate-500 mt-2 font-mono">{shortWalletId}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                className="pr-10"
                disabled={lockoutTime > 0}
                autoFocus
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {attempts > 0 && lockoutTime === 0 && (
            <Card className="bg-yellow-500/10 border-yellow-500/30 p-3">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-200">
                  {3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining
                </p>
              </div>
            </Card>
          )}

          {lockoutTime > 0 && (
            <Card className="bg-red-500/10 border-red-500/30 p-3">
              <div className="flex gap-2 items-start">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-200">
                  Too many failed attempts. Please wait {lockoutTime} seconds.
                </p>
              </div>
            </Card>
          )}

          <Button
            onClick={handleUnlock}
            disabled={loading || !password || lockoutTime > 0}
            className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90 h-12`}
          >
            {loading ? 'Unlocking...' : lockoutTime > 0 ? `Wait ${lockoutTime}s` : 'Unlock Wallet'}
          </Button>

          <Button
            onClick={onBack}
            variant="outline"
            className="w-full border-slate-700 hover:bg-slate-900"
          >
            Use Different Wallet
          </Button>
        </div>

        <Card className="bg-blue-500/10 border-blue-500/30 p-4 mt-6">
          <div className="flex gap-3">
            <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-200">
              <p className="font-medium mb-1">Your wallet is encrypted</p>
              <p className="text-blue-300">Your password never leaves this device and is required to decrypt your keys.</p>
            </div>
          </div>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            Forgot your password?{' '}
            <button className="text-purple-400 hover:text-purple-300">
              Restore with seed phrase
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
