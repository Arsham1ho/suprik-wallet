import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Fingerprint, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { authenticateBiometric, getBiometricTypeName } from '../utils/biometric';
import { toast } from 'sonner';

interface BiometricConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  walletId: string;
  title?: string;
  description?: string;
  amount?: string;
  token?: string;
  recipient?: string;
}

export function BiometricConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  walletId,
  title = 'Confirm Transaction',
  description,
  amount,
  token,
  recipient,
}: BiometricConfirmDialogProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const biometricType = getBiometricTypeName();

  const handleAuthenticate = async () => {
    // Validate walletId before attempting authentication
    if (!walletId || walletId.trim() === '') {
      console.error('[BiometricConfirm] Invalid walletId:', walletId);
      setError('Wallet not found. Please log in again.');
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await authenticateBiometric(
        walletId,
        `Confirm ${amount ? `${amount} ${token}` : 'transaction'}`
      );

      if (result.success) {
        onConfirm();
        onOpenChange(false);
        toast.success('Transaction confirmed');
      } else {
        if (result.cancelled) {
          setError('Authentication cancelled');
        } else {
          setError(result.error || 'Authentication failed');
        }
      }
    } catch (error) {
      console.error('[BiometricConfirm] Error:', error);
      setError('Authentication error. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Fingerprint className="w-6 h-6 text-purple-400" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-slate-400">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Details */}
          {(amount || recipient) && (
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
              {amount && token && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Amount</span>
                  <span className="text-white font-medium">{amount} {token}</span>
                </div>
              )}
              {recipient && (
                <div className="flex justify-between items-start">
                  <span className="text-slate-400 text-sm">To</span>
                  <span className="text-white text-sm font-mono text-right max-w-[200px] truncate">
                    {recipient}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Biometric Prompt */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-6 space-y-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                {isAuthenticating ? (
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                ) : (
                  <Fingerprint className="w-10 h-10 text-white" />
                )}
              </div>
            </div>

            <div className="text-center space-y-1">
              <p className="text-white font-medium">
                {isAuthenticating ? 'Authenticating...' : `Use ${biometricType}`}
              </p>
              <p className="text-slate-400 text-sm">
                {isAuthenticating 
                  ? 'Please complete authentication on your device' 
                  : 'Confirm this transaction with your biometric'
                }
              </p>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-950/30 border border-red-900/30 rounded-lg p-3 flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 text-sm font-medium">Authentication Failed</p>
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1 border-slate-700 hover:bg-slate-800"
              disabled={isAuthenticating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAuthenticate}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Authenticate
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
