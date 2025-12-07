import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface SuprikLogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function SuprikLogo({ size = 160, animate = true, className = '' }: SuprikLogoProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer glow effect */}
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
      
      {/* Main logo image */}
      <motion.div
        className="w-full h-full"
        animate={animate ? { 
          rotate: [0, 360],
        } : {}}
        transition={animate ? { 
          duration: 50, 
          repeat: Infinity, 
          ease: "linear" 
        } : {}}
        style={{
          filter: 'drop-shadow(0 0 30px rgba(168, 85, 247, 0.6))',
        }}
      >
        <ImageWithFallback
          src="/src/assets/suprik-logo.png"
          alt="Suprik Wallet Logo"
          className="w-full h-full object-contain"
          style={{
            imageRendering: 'crisp-edges',
          }}
        />
      </motion.div>
    </div>
  );
}

// Alias for backward compatibility
export const SupletLogo = SuprikLogo;