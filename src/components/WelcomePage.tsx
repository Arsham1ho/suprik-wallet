import { motion } from 'motion/react';
import { ChevronRight, Shield, Zap, Globe } from 'lucide-react';

interface WelcomePageProps {
  onContinue: () => void;
}

export function WelcomePage({ onContinue }: WelcomePageProps) {
  return (
    <div
      className="wallet-outer bg-black text-white flex items-center justify-center overflow-hidden relative select-none"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        overscrollBehavior: 'none',
      }}
    >
      {/* Mobile Container */}
      <div
        className="wallet-container w-full md:max-w-[430px] flex flex-col relative"
        style={{
          height: '100%',
          touchAction: 'none',
          overscrollBehavior: 'none'
        }}
      >
        {/* Background - Same as WelcomeAnimation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Central purple glow */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
              filter: 'blur(100px)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1,
              opacity: 0.5,
            }}
            transition={{
              duration: 1.5,
              ease: "easeOut"
            }}
          />
        </div>

        {/* Particles - Same as WelcomeAnimation */}
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
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10 relative z-10">
          <div className="space-y-8 w-full">
            {/* Logo with Real Wallet Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                duration: 0.8,
              }}
              className="relative flex items-center justify-center w-full"
            >
              {/* Logo container with gradient border */}
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-1">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                  {/* Real Suprik Wallet Logo */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-14 h-14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="welcomeLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      fill="url(#welcomeLogoGradient)"
                      opacity="1"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="url(#welcomeLogoGradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="url(#welcomeLogoGradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* Welcome Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-3"
            >
              <h1 
                className="text-4xl font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #c084fc 0%, #ec4899 50%, #22d3ee 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Welcome to
              </h1>
              <h2 
                className="text-5xl font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Suprik
              </h2>
              <p className="text-slate-300 mt-3">
                Your gateway to the decentralized future
              </p>
            </motion.div>

            {/* Features with Icons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="space-y-3 w-full"
            >
              <div 
                className="flex items-center gap-4 px-5 py-3 rounded-xl backdrop-blur-sm"
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <Shield className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <p className="text-slate-200">Secure & Private</p>
              </div>
              <div 
                className="flex items-center gap-4 px-5 py-3 rounded-xl backdrop-blur-sm"
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                }}
              >
                <Globe className="w-5 h-5 text-pink-400 flex-shrink-0" />
                <p className="text-slate-200">Multi-Chain Support</p>
              </div>
              <div 
                className="flex items-center gap-4 px-5 py-3 rounded-xl backdrop-blur-sm"
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                }}
              >
                <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <p className="text-slate-200">Innovative CosmoPay</p>
              </div>
            </motion.div>

            {/* Continue Button */}
            <motion.button
              onClick={onContinue}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-8 py-4 rounded-2xl text-white font-medium shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
              style={{
                background: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.5)',
                touchAction: 'manipulation',
              }}
            >
              <span className="text-lg">Continue</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </div>

        {/* Sparkle decorations */}
        <motion.div
          className="absolute top-20 right-8"
          animate={{
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
            <path
              d="M15 0L16.5 13.5L30 15L16.5 16.5L15 30L13.5 16.5L0 15L13.5 13.5L15 0Z"
              fill="white"
              opacity="0.8"
            />
          </svg>
        </motion.div>

        <motion.div
          className="absolute bottom-24 left-8"
          animate={{
            rotate: [0, -180, -360],
            scale: [0.8, 1, 0.8],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 0L11 9L20 10L11 11L10 20L9 11L0 10L9 9L10 0Z"
              fill="white"
              opacity="0.7"
            />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}