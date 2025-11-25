import { motion } from 'motion/react';
import { SuprikLogo } from './SuprikLogo';

interface PageTransitionProps {
  onComplete: () => void;
}

export function PageTransition({ onComplete }: PageTransitionProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, delay: 0.9 }}
      onAnimationComplete={onComplete}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* Logo with fast spin animation */}
      <motion.div
        className="relative w-40 h-40 rounded-full overflow-hidden"
        initial={{ rotate: 0, scale: 1 }}
        animate={{ 
          rotate: [0, 1080], // 3 full rotations - faster!
          scale: [1, 1.15, 1]
        }}
        transition={{ 
          duration: 0.7, // Faster - 0.7 seconds instead of 1
          ease: [0.34, 1.56, 0.64, 1], // Bouncy easing
        }}
        style={{
          background: 'transparent',
          willChange: 'transform',
        }}
      >
        <div
          style={{
            filter: 'drop-shadow(0 0 40px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))',
            mixBlendMode: 'screen',
          }}
        >
          <SuprikLogo size={160} />
        </div>
      </motion.div>

      {/* Glow effect */}
      <motion.div 
        className="absolute inset-0 -m-12 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 60%)',
          filter: 'blur(60px)',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 1,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}