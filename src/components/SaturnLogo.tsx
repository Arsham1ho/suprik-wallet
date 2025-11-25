import { motion } from 'motion/react';

interface SupletLogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function SupletLogo({ size = 160, animate = true, className = '' }: SupletLogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer glow */}
      {animate && (
        <motion.div 
          className="absolute inset-0 -m-8 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(139, 92, 246, 0.3) 30%, transparent 70%)',
            filter: 'blur(40px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.9, 0.6],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
      
      {/* Main SVG */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-2xl"
        animate={animate ? { rotate: [0, 360] } : {}}
        transition={animate ? { duration: 50, repeat: Infinity, ease: "linear" } : {}}
        style={{
          filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.6))',
        }}
      >
        {/* Background circle */}
        <circle 
          cx="100" 
          cy="100" 
          r="95" 
          fill="url(#bgGradient)"
          opacity="0.1"
        />
        
        {/* Main planet (Suprik) */}
        <circle 
          cx="100" 
          cy="100" 
          r="60" 
          fill="url(#planetGradient)"
        />
        
        {/* Planet details/texture */}
        <ellipse 
          cx="100" 
          cy="85" 
          rx="55" 
          ry="12" 
          fill="rgba(139, 92, 246, 0.3)"
          opacity="0.6"
        />
        <ellipse 
          cx="100" 
          cy="100" 
          rx="55" 
          ry="8" 
          fill="rgba(99, 102, 241, 0.3)"
          opacity="0.5"
        />
        <ellipse 
          cx="100" 
          cy="115" 
          rx="55" 
          ry="10" 
          fill="rgba(168, 85, 247, 0.3)"
          opacity="0.6"
        />
        
        {/* Ring back part (behind planet) */}
        <ellipse 
          cx="100" 
          cy="100" 
          rx="88" 
          ry="25" 
          fill="none"
          stroke="url(#ringGradient1)"
          strokeWidth="8"
          opacity="0.4"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0 40%)' }}
        />
        
        {/* Ring front part (in front of planet) */}
        <ellipse 
          cx="100" 
          cy="100" 
          rx="88" 
          ry="25" 
          fill="none"
          stroke="url(#ringGradient2)"
          strokeWidth="10"
          opacity="0.8"
          style={{ clipPath: 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)' }}
        />
        
        {/* Inner ring */}
        <ellipse 
          cx="100" 
          cy="100" 
          rx="75" 
          ry="20" 
          fill="none"
          stroke="url(#ringGradient3)"
          strokeWidth="4"
          opacity="0.6"
          style={{ clipPath: 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)' }}
        />
        
        {/* Glow effect on planet */}
        <circle 
          cx="80" 
          cy="80" 
          r="20" 
          fill="rgba(255, 255, 255, 0.2)"
          filter="blur(10px)"
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          
          <radialGradient id="planetGradient" cx="40%" cy="40%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="30%" stopColor="#a855f7" />
            <stop offset="60%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </radialGradient>
          
          <linearGradient id="ringGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
          </linearGradient>
          
          <linearGradient id="ringGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
            <stop offset="25%" stopColor="#8b5cf6" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
            <stop offset="75%" stopColor="#8b5cf6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
          </linearGradient>
          
          <linearGradient id="ringGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#e0b3ff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}