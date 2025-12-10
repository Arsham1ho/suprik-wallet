import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { SuprikLogo } from './SuprikLogo';

interface WelcomeAnimationProps {
  onComplete: () => void;
}

export function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    
    // Save original styles
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    const originalUserSelect = document.body.style.userSelect;
    const originalPosition = document.body.style.position;
    
    // Apply prevention styles
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.userSelect = 'none';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      document.body.style.userSelect = originalUserSelect;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // Welcome animation duration - 2 seconds for first-time users
  const duration = 2000;

  useEffect(() => {
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [onComplete, duration]);

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
      {/* Simplified background for mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
            filter: isMobile ? 'blur(60px)' : 'blur(100px)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1,
            opacity: 0.5,
          }}
          transition={{
            duration: isMobile ? 0.8 : 1.5,
            ease: "easeOut"
          }}
        />
      </div>

      {/* Reduced particles for mobile */}
      {!isMobile && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                y: [0, -50],
              }}
              transition={{
                duration: 1.5,
                delay: Math.random() * 1,
                repeat: 1,
              }}
            />
          ))}
        </div>
      )}

      {/* Logo - Optimized */}
      <div className="relative z-10 select-none pointer-events-none" style={{ touchAction: 'none' }}>
        {/* Simplified ring effect for mobile */}
        {!isMobile && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-purple-500/40 rounded-full"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ 
              scale: [0, 2],
              opacity: [1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: 1,
              ease: "easeOut"
            }}
          />
        )}

        {/* Saturn Logo */}
        <motion.div
          className="relative select-none pointer-events-none"
        >
          <div className="w-40 h-40 rounded-full overflow-hidden relative select-none pointer-events-none">
            {/* Simplified glow */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.5) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }}
              animate={isMobile ? {} : {
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.7, 0.5],
              }}
              transition={isMobile ? {} : {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Logo image - no rotation on mobile */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
              animate={isMobile ? {} : {
                rotate: [0, 360],
              }}
              transition={isMobile ? {} : {
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div
                className="select-none pointer-events-none"
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                <SuprikLogo size={160} />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Welcome text */}
      <motion.div
        className="mt-10 text-center relative z-10 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: isMobile ? 0.3 : 0.6, duration: 0.5 }}
      >
        <h1 
          className="text-5xl font-bold mb-2"
          style={{
            background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Welcome
        </h1>
        <p className="text-slate-400 text-lg">
          to Suplet Wallet
        </p>

        {/* Loading dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-purple-400 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.15,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}