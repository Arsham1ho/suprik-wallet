/**
 * Pull to Refresh Component
 * Native-like pull to refresh for mobile
 */

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../utils/mobile/gestures';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
}

export function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh(onRefresh, threshold);

  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const rotation = (progress / 100) * 360;

  return (
    <div className="relative">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
        animate={{
          y: isRefreshing ? 60 : isPulling ? pullDistance : 0,
          opacity: isPulling || isRefreshing ? 1 : 0,
        }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 300,
        }}
      >
        <div className="bg-slate-900/95 backdrop-blur-lg rounded-full p-3 shadow-lg border border-slate-800">
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : rotation,
            }}
            transition={{
              duration: isRefreshing ? 1 : 0,
              repeat: isRefreshing ? Infinity : 0,
              ease: 'linear',
            }}
          >
            <RefreshCw 
              className={`w-6 h-6 ${
                progress >= 100 || isRefreshing 
                  ? 'text-purple-400' 
                  : 'text-slate-400'
              }`} 
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        animate={{
          y: isRefreshing ? 80 : 0,
        }}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 300,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
