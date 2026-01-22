import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { motion } from 'motion/react';
import { X, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { TokenLogo } from './TokenLogo';
import { useTheme } from '../utils/ThemeContext';

interface SwapFailedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromToken: {
    symbol: string;
    name: string;
    amount: string;
    logo: string;
    logoUrl: string;
    color: string;
  };
  toToken: {
    symbol: string;
    name: string;
    logo: string;
    logoUrl: string;
    color: string;
  };
  error: string;
  onRetry?: () => void;
  signature?: string;
  isTestnet?: boolean;
}

export function SwapFailedDialog({
  open,
  onOpenChange,
  fromToken,
  toToken,
  error,
  onRetry,
  signature,
  isTestnet = false
}: SwapFailedDialogProps) {
  const { colors } = useTheme();
  // Parse error for user-friendly messages
  const getErrorTitle = () => {
    if (error.includes('slippage') || error.includes('0x1788') || error.includes('Price moved')) {
      return 'Price Changed Too Much';
    }
    if (error.includes('insufficient') || error.includes('Insufficient') || error.includes('balance')) {
      return 'Insufficient Balance';
    }
    if (error.includes('timeout') || error.includes('expired')) {
      return 'Transaction Expired';
    }
    if (error.includes('network') || error.includes('connection')) {
      return 'Network Error';
    }
    if (error.includes('rent') || error.includes('lamports')) {
      return 'Not Enough SOL for Fees';
    }
    return 'Swap Failed';
  };

  const getErrorIcon = () => {
    if (error.includes('slippage') || error.includes('Price moved')) {
      return '📊';
    }
    if (error.includes('insufficient') || error.includes('balance')) {
      return '💰';
    }
    if (error.includes('timeout') || error.includes('expired')) {
      return '⏱️';
    }
    if (error.includes('network')) {
      return '🌐';
    }
    if (error.includes('rent') || error.includes('lamports')) {
      return '⛽';
    }
    return '❌';
  };

  const getSuggestion = () => {
    if (error.includes('slippage') || error.includes('0x1788') || error.includes('Price moved')) {
      return 'Try increasing slippage tolerance or swapping a smaller amount.';
    }
    if (error.includes('rent') || error.includes('lamports')) {
      return 'You need more SOL to create a token account. Deposit at least 0.01 SOL.';
    }
    if (error.includes('insufficient') || error.includes('Insufficient') || error.includes('balance')) {
      return 'Make sure you have enough balance including fees.';
    }
    if (error.includes('timeout') || error.includes('expired')) {
      return 'The network is busy. Please try again in a moment.';
    }
    if (error.includes('network') || error.includes('connection')) {
      return 'Check your internet connection and try again.';
    }
    return 'Please try again or contact support if the issue persists.';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-md">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute -top-1 -right-1 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-all z-10 backdrop-blur-sm"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>

          {/* Error animation */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.1
            }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              {/* Red glow background */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-orange-500/30 blur-2xl rounded-full" />

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.2
                }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                  >
                    <AlertTriangle className="w-12 h-12 text-red-400" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Animated pulse rings */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [0.8, 1.3, 1.3],
                  opacity: [0, 0.4, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute inset-0 rounded-full border-2 border-red-400"
              />
            </div>
          </motion.div>

          {/* Title */}
          <DialogTitle asChild>
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-center text-red-400 mb-2"
            >
              {getErrorTitle()} {getErrorIcon()}
            </motion.h2>
          </DialogTitle>

          <DialogDescription asChild>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-center mb-4"
            >
              <p className="text-slate-400 text-sm">Your swap could not be completed</p>
            </motion.div>
          </DialogDescription>

          {/* Swap attempt details */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-4 mb-4 border border-red-500/20 shadow-xl backdrop-blur-sm overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TokenLogo
                  logoUrl={fromToken.logoUrl}
                  logo={fromToken.logo}
                  name={fromToken.name}
                  color={fromToken.color}
                  symbol={fromToken.symbol}
                  size="sm"
                />
                <div>
                  <p className="text-white font-medium">{fromToken.amount} {fromToken.symbol}</p>
                </div>
              </div>

              <div className="text-slate-500 px-2">→</div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-white font-medium">{toToken.symbol}</p>
                </div>
                <TokenLogo
                  logoUrl={toToken.logoUrl}
                  logo={toToken.logo}
                  name={toToken.name}
                  color={toToken.color}
                  symbol={toToken.symbol}
                  size="sm"
                />
              </div>
            </div>
          </motion.div>

          {/* Error details */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4"
          >
            <p className="text-red-300 text-sm mb-2">{error}</p>
            <p className="text-slate-400 text-xs">{getSuggestion()}</p>
          </motion.div>

          {/* Transaction link if available */}
          {signature && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-4"
            >
              <a
                href={`https://solscan.io/tx/${signature}${isTestnet ? '?cluster=devnet' : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm transition-all bg-slate-800/50 hover:bg-slate-800 rounded-lg py-2.5 border border-slate-700/50 group"
                style={{ color: colors.accent }}
              >
                <ExternalLink className="w-4 h-4" />
                View transaction on Solscan
              </a>
            </motion.div>
          )}

          {/* Action buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="space-y-3"
          >
            {onRetry && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onOpenChange(false);
                  onRetry();
                }}
                className="w-full py-3.5 rounded-xl transition-all font-semibold text-white shadow-lg flex items-center justify-center gap-2"
                style={{
                  backgroundColor: colors.primary,
                  boxShadow: `0 4px 14px -3px ${colors.primary}4D`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenChange(false)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all font-medium text-slate-300"
            >
              Close
            </motion.button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
