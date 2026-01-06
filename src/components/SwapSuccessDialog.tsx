import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { motion } from 'motion/react';
import { ArrowDown, X, ExternalLink, Copy } from 'lucide-react';
import { TokenLogo } from './TokenLogo';
import { useLanguage } from '../utils/i18n/LanguageContext';
import { useTheme } from '../utils/ThemeContext';
import { toast } from 'sonner';

interface SwapSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromToken: {
    symbol: string;
    name: string;
    amount: string;
    logo: string;
    logoUrl: string;
    color: string;
    usdValue?: string;
  };
  toToken: {
    symbol: string;
    name: string;
    amount: string;
    logo: string;
    logoUrl: string;
    color: string;
    usdValue?: string;
  };
  fee?: string;
  feeUSD?: string;
  signature?: string;
  isTestnet?: boolean;
}

export function SwapSuccessDialog({
  open,
  onOpenChange,
  fromToken,
  toToken,
  fee,
  feeUSD,
  signature,
  isTestnet = false
}: SwapSuccessDialogProps) {
  const { formatPrice } = useLanguage();
  const { colors } = useTheme();

  const handleCopySignature = () => {
    if (signature) {
      navigator.clipboard.writeText(signature);
      toast.success('Signature copied to clipboard!');
    }
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

          {/* Success animation */}
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
              {/* Gradient background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 to-emerald-500/30 blur-2xl rounded-full" />

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
                <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-125"
                  >
                    <source src="/swap.mp4" type="video/mp4" />
                  </video>
                </div>
              </motion.div>

              {/* Animated rings */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [0.8, 1.3, 1.3],
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute inset-0 rounded-full border-2 border-green-400"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [0.8, 1.5, 1.5],
                  opacity: [0, 0.4, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.3,
                  ease: "easeOut"
                }}
                className="absolute inset-0 rounded-full border-2 border-emerald-400"
              />
            </div>
          </motion.div>

          {/* Title */}
          <DialogTitle asChild>
            <motion.h2
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-center bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mb-2"
            >
              Swap Complete!
            </motion.h2>
          </DialogTitle>

          <DialogDescription asChild>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-center mb-6"
            >
              {isTestnet && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                  <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                  <span className="text-yellow-400 text-xs font-medium">Testnet Mode</span>
                </div>
              )}
              {!isTestnet && (
                <p className="text-slate-400 text-sm">Your transaction has been confirmed</p>
              )}
            </motion.div>
          </DialogDescription>

          {/* Swap details card */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-5 mb-4 border border-slate-700/50 shadow-xl backdrop-blur-sm overflow-hidden"
          >
            {/* Gradient overlay */}
            <div
              className="absolute inset-0 bg-gradient-to-br pointer-events-none"
              style={{ background: `linear-gradient(to bottom right, ${colors.primary}0D, ${colors.secondary}0D)` }}
            />

            <div className="relative space-y-4">
              {/* From token */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <TokenLogo
                      logoUrl={fromToken.logoUrl}
                      logo={fromToken.logo}
                      name={fromToken.name}
                      color={fromToken.color}
                      symbol={fromToken.symbol}
                      mint={(fromToken as any).mint}
                      size="md"
                    />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">You paid</p>
                    <p className="text-white font-semibold">{fromToken.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-lg">-{fromToken.amount}</p>
                  {fromToken.usdValue && (
                    <p className="text-slate-400 text-xs">≈ ${fromToken.usdValue}</p>
                  )}
                </div>
              </div>

              {/* Animated arrow */}
              <div className="flex justify-center relative">
                <motion.div
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 10,
                    delay: 0.5
                  }}
                  className="rounded-full p-2"
                  style={{ background: `linear-gradient(to bottom right, ${colors.primary}, ${colors.secondary})` }}
                >
                  <ArrowDown className="w-4 h-4 text-white" strokeWidth={2.5} />
                </motion.div>
              </div>

              {/* To token */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <TokenLogo
                      logoUrl={toToken.logoUrl}
                      logo={toToken.logo}
                      name={toToken.name}
                      color={toToken.color}
                      symbol={toToken.symbol}
                      mint={(toToken as any).mint}
                      size="md"
                    />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">You received</p>
                    <p className="text-white font-semibold">{toToken.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold text-lg">+{toToken.amount}</p>
                  {toToken.usdValue && (
                    <p className="text-slate-400 text-xs">≈ ${toToken.usdValue}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Transaction details */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="space-y-2.5 mb-6"
          >
            {/* Network fee - Solana transaction fee */}
            <div className="flex items-center justify-between text-sm bg-slate-800/40 rounded-lg px-3 py-2">
              <span className="text-slate-400">Network Fee</span>
              <span className="text-white font-medium">
                ~0.000005 SOL <span className="text-slate-400 text-xs">(≈ $0.001)</span>
              </span>
            </div>

            {/* Transaction signature */}
            {signature && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm bg-slate-800/40 rounded-lg px-3 py-2">
                  <span className="text-slate-400">Transaction</span>
                  <button
                    onClick={handleCopySignature}
                    className="flex items-center gap-1.5 transition-colors group"
                    style={{ color: colors.accent }}
                    title="Copy signature"
                  >
                    <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span className="font-mono text-xs">
                      {signature.substring(0, 4)}...{signature.substring(signature.length - 4)}
                    </span>
                  </button>
                </div>
                <a
                  href={`https://solscan.io/tx/${signature}${isTestnet ? '?cluster=devnet' : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm transition-all rounded-lg py-2.5 border group"
                  style={{
                    color: colors.accent,
                    background: `linear-gradient(to right, ${colors.primary}1A, ${colors.secondary}1A)`,
                    borderColor: `${colors.primary}33`
                  }}
                >
                  <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  View on Solscan
                </a>
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center justify-between text-sm bg-slate-800/40 rounded-lg px-3 py-2">
              <span className="text-slate-400">Time</span>
              <span className="text-white font-medium">
                {new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
          </motion.div>

          {/* Action button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenChange(false)}
            className="w-full py-3.5 rounded-xl transition-all font-semibold text-white shadow-lg"
            style={{
              background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})`,
              boxShadow: `0 10px 15px -3px ${colors.primary}40`
            }}
          >
            Done
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
