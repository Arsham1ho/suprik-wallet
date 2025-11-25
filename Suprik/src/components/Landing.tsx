import { Sparkles, Shield, Zap, Lock, Wallet, ArrowRight, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { SuprikLogo } from './SuprikLogo';
import { useState, useEffect } from 'react';
import { GradientButton } from './GradientButton';
import { Button } from './ui/button';

interface LandingProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

export function Landing({ onCreateWallet, onImportWallet }: LandingProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reduced animations for mobile
  const backgroundAnimation = isMobile ? {} : {
    scale: [1, 1.1, 1],
    opacity: [0.3, 0.5, 0.3],
  };

  // Logo rotation - enabled for ALL devices (mobile + desktop)
  const logoRotation = { rotate: [0, 360] };
  const logoTransition = { duration: 50, repeat: Infinity, ease: "linear" };

  return (
    <div 
      className="h-screen bg-black text-white flex items-center justify-center overflow-hidden relative select-none"
      style={{
        position: 'fixed',
        inset: 0,
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        overscrollBehavior: 'none'
      }}
    >
      {/* Mobile Container */}
      <div 
        className="w-full max-w-[430px] h-full flex flex-col relative"
        style={{
          touchAction: 'none',
          overscrollBehavior: 'none'
        }}
      >
        {/* Simplified gradient background for mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Static gradient for mobile, animated for desktop */}
          <motion.div 
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 70%)',
              filter: isMobile ? 'blur(80px)' : 'blur(120px)',
              willChange: isMobile ? 'auto' : 'transform, opacity',
            }}
            animate={backgroundAnimation}
            transition={isMobile ? {} : {
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(99, 102, 241, 0.2) 50%, transparent 70%)',
              filter: isMobile ? 'blur(80px)' : 'blur(100px)',
              willChange: isMobile ? 'auto' : 'transform, opacity',
            }}
            animate={isMobile ? {} : {
              scale: [1.1, 0.9, 1.1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={isMobile ? {} : {
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col px-6 py-8 relative z-10">
          {/* Animated Stars Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: '-10px',
                  opacity: Math.random() * 0.5 + 0.2,
                  boxShadow: `0 0 ${Math.random() * 8 + 4}px rgba(255, 255, 255, 0.6)`,
                  filter: 'blur(1px)',
                }}
                animate={{
                  y: [0, -window.innerHeight - 100],
                  opacity: [0, 0.6, 0.6, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  delay: Math.random() * 5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}
            
            {/* Larger stars */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={`large-${i}`}
                className="absolute rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: '-10px',
                  width: `${Math.random() * 4 + 3}px`,
                  height: `${Math.random() * 4 + 3}px`,
                  background: 'radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%)',
                  filter: 'blur(2px)',
                }}
                animate={{
                  y: [0, -window.innerHeight - 100],
                  opacity: [0, 0.5, 0.5, 0],
                  scale: [0.5, 1, 1, 0.5],
                }}
                transition={{
                  duration: Math.random() * 4 + 3,
                  delay: Math.random() * 6,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            ))}

            {/* Shooting stars */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`shooting-${i}`}
                className="absolute h-[2px] rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: `${Math.random() * 50 + 25}%`,
                  width: '80px',
                  background: 'linear-gradient(90deg, transparent, rgba(168, 85, 247, 0.5), transparent)',
                  filter: 'blur(1.5px)',
                }}
                animate={{
                  x: [0, 150],
                  y: [0, -100],
                  opacity: [0, 0.7, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: Math.random() * 8 + 2,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 10 + 5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* Hero Section */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Logo - Optimized */}
            <motion.div 
              className="relative mb-8 select-none pointer-events-none"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.6,
                ease: "easeOut"
              }}
            >
              {/* Simplified glow for mobile */}
              {!isMobile && (
                <motion.div 
                  className="absolute inset-0 -m-12 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                  }}
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.4, 0.6, 0.4],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              {/* Logo - conditional rotation */}
              <motion.div
                className="relative w-40 h-40 rounded-full overflow-hidden"
                animate={logoRotation}
                transition={logoTransition}
                style={{
                  background: 'transparent',
                  willChange: isMobile ? 'auto' : 'transform',
                }}
              >
                <div 
                  className="w-full h-full select-none pointer-events-none"
                  style={{
                    WebkitUserDrag: 'none',
                    userSelect: 'none',
                    pointerEvents: 'none',
                    touchAction: 'none',
                    filter: isMobile 
                      ? 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))' 
                      : 'drop-shadow(0 0 40px rgba(168, 85, 247, 0.8)) drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))',
                    mixBlendMode: 'screen',
                  }}
                >
                  <SuprikLogo size={160} />
                </div>
              </motion.div>
            </motion.div>

            {/* Brand & Tagline */}
            <motion.div 
              className="text-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h1 
                className="text-6xl md:text-7xl font-bold mb-3 select-none"
                style={{
                  background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #6366f1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Suprik
              </h1>
              <p className="text-slate-300 mb-2 tracking-wide select-none">
                The friendly crypto wallet
              </p>
              <p className="text-sm text-slate-500 max-w-[280px] mx-auto select-none">
                Buy, store, send and swap tokens
              </p>
            </motion.div>

            {/* Feature Highlights - Simplified */}
            <motion.div 
              className="grid grid-cols-2 gap-3 w-full max-w-[340px] mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {[
                { icon: Shield, text: 'Secure', color: 'purple' },
                { icon: Zap, text: 'Fast', color: 'blue' },
                { icon: Lock, text: 'Private', color: 'pink' },
                { icon: Wallet, text: 'Multi-chain', color: 'cyan' },
              ].map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 select-none"
                >
                  <div className={`w-8 h-8 rounded-lg bg-${feature.color}-500/15 flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className={`w-4 h-4 text-${feature.color}-400`} />
                  </div>
                  <span className="text-xs text-slate-300 font-medium">{feature.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* CTA Section */}
          <motion.div 
            className="space-y-3 pb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* Create Wallet - Primary CTA */}
            <GradientButton 
              onClick={onCreateWallet}
              className="w-full h-14 text-base shadow-xl shadow-purple-500/30 select-none"
              style={{
                touchAction: 'manipulation',
                WebkitUserDrag: 'none',
                userSelect: 'none'
              }}
            >
              <span className="flex items-center justify-center gap-2 select-none">
                <Sparkles className="w-4 h-4" />
                Create New Wallet
                <ArrowRight className="w-4 h-4" />
              </span>
            </GradientButton>
            
            {/* Import Wallet - Secondary CTA */}
            <Button 
              onClick={onImportWallet}
              variant="outline"
              className="w-full h-14 border-slate-700/70 bg-slate-900/60 hover:bg-slate-800/60 text-white backdrop-blur-sm transition-colors text-base select-none shadow-lg"
              style={{
                touchAction: 'manipulation',
                WebkitUserDrag: 'none',
                userSelect: 'none'
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                I already have a wallet
              </span>
            </Button>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-2 pt-2 pb-1 select-none">
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-slate-500">
                Trusted by thousands
              </span>
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-slate-700 select-none">
              By continuing, you agree to our{' '}
              <span className="text-slate-600 underline">Terms of Service</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}