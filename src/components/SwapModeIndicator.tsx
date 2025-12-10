import { motion } from 'motion/react';
import { Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SwapModeIndicatorProps {
  isRealMode: boolean;
  route?: string | null;
  priceImpact?: number | null;
}

/**
 * Indicator showing whether Swap is using Real Jupiter API or Demo Mode
 */
export function SwapModeIndicator({ isRealMode, route, priceImpact }: SwapModeIndicatorProps) {
  const isDemoMode = route?.includes('Demo Mode') || route?.includes('unavailable');
  const showRealMode = isRealMode && !isDemoMode;

  if (!route) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-3"
    >
      {showRealMode ? (
        // Real Mode - Jupiter Active
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="relative">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <motion.div
              className="absolute inset-0"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </motion.div>
          </div>
          <div className="flex-1">
            <p className="text-green-400 text-xs font-semibold">
              Real Mode - Jupiter Active
            </p>
            <p className="text-green-300/60 text-xs">
              Live prices from Solana DEXs
            </p>
          </div>
          <Zap className="w-3.5 h-3.5 text-green-400" />
        </div>
      ) : (
        // Demo Mode - Jupiter Unavailable
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <div className="flex-1">
            <p className="text-amber-400 text-xs font-semibold">
              Demo Mode
            </p>
            <p className="text-amber-300/60 text-xs">
              Simulated prices (Jupiter API unavailable)
            </p>
          </div>
        </div>
      )}

      {/* Route Info - Only show in Real Mode */}
      {showRealMode && route && !isDemoMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800/30"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Route:</span>
            <span className="text-slate-200 font-mono">{route}</span>
          </div>
          {priceImpact !== null && priceImpact !== undefined && (
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-400">Price Impact:</span>
              <span className={`font-semibold ${
                Math.abs(priceImpact) > 1 ? 'text-red-400' : 
                Math.abs(priceImpact) > 0.5 ? 'text-amber-400' : 
                'text-green-400'
              }`}>
                {priceImpact > 0 ? '+' : ''}{priceImpact.toFixed(2)}%
              </span>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
