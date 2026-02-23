import { useEffect } from 'react';
import { motion } from 'motion/react';


interface WelcomeAnimationProps {
  onComplete: () => void;
}

export function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  useEffect(() => {
    // Save original styles
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    const originalUserSelect = document.body.style.userSelect;
    const originalPosition = document.body.style.position;

    // Lock body during animation
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.userSelect = 'none';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      document.body.style.userSelect = originalUserSelect;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // Auto-advance after 2.2 seconds
  useEffect(() => {
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 w-full h-full bg-black text-white flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        overscrollBehavior: 'none',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 420,
            height: 420,
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(88, 28, 235, 0.08) 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>

      {/* Text */}
      <motion.div
        className="mt-8 text-center relative z-10 pointer-events-none"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <h1
          className="text-4xl font-bold mb-1.5"
          style={{
            background: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Suprik
        </h1>
        <p className="text-slate-500 text-sm">Crypto Wallet</p>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        className="mt-8 flex items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'rgba(139, 92, 246, 0.6)' }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 0.9,
              delay: i * 0.15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
