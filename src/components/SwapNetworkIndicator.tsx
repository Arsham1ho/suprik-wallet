import { useNetwork } from '../utils/NetworkContext';
import { Globe } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Network Mode Indicator for Swap Page
 * Shows whether user is on Mainnet or Testnet
 */
export function SwapNetworkIndicator() {
  const { isTestnet, networkMode } = useNetwork();

  return (
    <motion.div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs
        ${isTestnet 
          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300' 
          : 'bg-green-500/10 border border-green-500/30 text-green-300'
        }
      `}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Globe className="w-3 h-3" />
      <span className="font-medium">
        {isTestnet ? 'Testnet' : 'Mainnet'}
      </span>
    </motion.div>
  );
}
