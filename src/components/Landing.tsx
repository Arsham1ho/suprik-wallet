import { Sparkles, Shield, Zap, Lock, ArrowRight, Check } from 'lucide-react';
import { motion } from 'motion/react';
import logo from 'figma:asset/ed7942d275ee52c87815efe3d7991e061c49a8ae.png';
import backgroundImage from 'figma:asset/7fff6c0f4086de297821ed0e75fcf92b1f55b37f.png';

interface LandingProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

export function Landing({ onCreateWallet, onImportWallet }: LandingProps) {
  return (
    <div
      className="text-white relative select-none flex flex-col"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitOverflowScrolling: 'touch',
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#050510',
      }}
    >

        {/* Content */}
        <div className="flex flex-col px-6 py-6 relative z-10">
          {/* Hero Section */}
          <div className="flex flex-col items-center justify-start pt-4">
            {/* Logo Circle - Light purple with atom icon */}
            <div className="relative mb-6 select-none pointer-events-none">
              {/* Outer glow */}
              <motion.div 
                className="absolute inset-0 -m-6 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(216, 180, 254, 0.3) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Logo */}
              <div className="relative w-32 h-32 rounded-full flex items-center justify-center">
                <motion.img 
                  src={logo} 
                  alt="Suprik Logo" 
                  className="w-32 h-32 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </div>
            </div>

            {/* Brand & Tagline */}
            <div className="text-center mb-8">
              <h1 
                className="text-6xl font-bold mb-3 select-none tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Suprik
              </h1>
              <p className="text-white mb-2 select-none">
                The friendly crypto wallet
              </p>
              <p className="text-sm text-slate-400 select-none">
                Buy, store, send and swap tokens
              </p>
            </div>

            {/* Feature Highlights - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-[380px] mb-10">
              {[
                { icon: Shield, text: 'Secure' },
                { icon: Zap, text: 'Fast' },
                { icon: Lock, text: 'Private' },
                { icon: Sparkles, text: 'Easy' },
              ].map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl backdrop-blur-sm select-none"
                  style={{
                    background: 'rgba(15, 10, 26, 0.6)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.1)',
                  }}
                >
                  <feature.icon className="w-5 h-5 text-purple-300 flex-shrink-0" />
                  <span className="text-slate-200">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div
            className="space-y-3 pb-8 mt-auto"
            style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
          >
            {/* Create Wallet - Primary CTA with gradient */}
            <button
              onClick={onCreateWallet}
              className="w-full h-14 rounded-2xl font-medium select-none relative overflow-hidden transition-transform active:scale-95"
              style={{
                background: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
                touchAction: 'manipulation',
                WebkitUserDrag: 'none',
                userSelect: 'none',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.5)',
              }}
            >
              <span className="flex items-center justify-center gap-2.5 select-none text-white">
                <Sparkles className="w-5 h-5" />
                Create New Wallet
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
            
            {/* Import Wallet - Secondary CTA - dark button */}
            <button
              onClick={onImportWallet}
              className="w-full h-14 rounded-2xl text-white backdrop-blur-sm transition-all active:scale-95 select-none"
              style={{
                background: 'rgba(15, 10, 26, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                touchAction: 'manipulation',
                WebkitUserDrag: 'none',
                userSelect: 'none'
              }}
            >
              <span className="flex items-center justify-center gap-2.5">
                <Lock className="w-5 h-5" />
                I already have a wallet
              </span>
            </button>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-2 pt-2 select-none">
              <Check className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">
                Trusted by thousands
              </span>
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-slate-500 select-none pt-1">
              By continuing, you agree to our{' '}
              <span className="text-slate-400 underline cursor-pointer">Terms of Service</span>
            </p>
          </div>
        </div>
    </div>
  );
}
