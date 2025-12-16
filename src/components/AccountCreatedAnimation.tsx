import { useState, useEffect } from 'react';
import { CheckCircle2, Rocket } from 'lucide-react';
import { Button } from './ui/button';

interface AccountCreatedAnimationProps {
  onComplete: () => void;
}

export function AccountCreatedAnimation({ onComplete }: AccountCreatedAnimationProps) {
  const [showButton, setShowButton] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Show content immediately, button after delay
  useEffect(() => {
    // Make visible immediately
    setIsVisible(true);

    const timer = setTimeout(() => {
      setShowButton(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="text-white relative flex flex-col items-center justify-center px-6"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        backgroundColor: '#000000',
        paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
      }}
    >
        {/* Simple background glow - CSS only, no motion */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Simple pulsing rings - CSS animation only */}
        <style>{`
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.4; }
            100% { transform: scale(2); opacity: 0; }
          }
          @keyframes pulse-ring-2 {
            0% { transform: scale(1); opacity: 0.3; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.5); }
            50% { box-shadow: 0 0 60px rgba(236, 72, 153, 0.6); }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
          .animate-scale-in {
            animation: scale-in 0.4s ease-out forwards;
          }
          .animate-glow {
            animation: glow-pulse 2s ease-in-out infinite;
          }
          .shimmer-effect {
            animation: shimmer 2s linear infinite;
          }
        `}</style>

        {/* Main content */}
        <div
          className={`relative z-10 flex flex-col items-center max-w-md w-full transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Success icon container */}
          <div className="relative mb-12 animate-scale-in">
            {/* Pulsing rings - CSS only */}
            <div
              className="absolute rounded-full border-2 border-purple-500/30"
              style={{
                width: 160,
                height: 160,
                left: -20,
                top: -20,
                animation: 'pulse-ring 2s ease-out infinite',
              }}
            />
            <div
              className="absolute rounded-full border-2 border-purple-500/20"
              style={{
                width: 160,
                height: 160,
                left: -20,
                top: -20,
                animation: 'pulse-ring-2 2s ease-out infinite 0.5s',
              }}
            />

            {/* Main checkmark circle */}
            <div
              className="relative w-[120px] h-[120px] rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 flex items-center justify-center shadow-2xl animate-glow"
            >
              <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={3} />
            </div>

            {/* Simple decorative icons - static positioned */}
            <div className="absolute -top-2 -right-2 text-yellow-400 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -left-3 text-pink-400 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            <div className="absolute top-1/2 -right-6 text-blue-400 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
              </svg>
            </div>
          </div>

          {/* Success text */}
          <div className="text-center space-y-4 mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Welcome to Suprik!
            </h1>

            <p className="text-slate-400 text-base">
              Your wallet is ready to explore the universe
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['Secure', 'Fast', 'Easy'].map((feature, i) => (
                <div
                  key={feature}
                  className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm animate-fade-in"
                  style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Get Started button */}
          {showButton && (
            <div className="w-full animate-fade-in">
              <div className="relative w-full">
                <Button
                  onClick={onComplete}
                  className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 hover:from-purple-500 hover:via-pink-400 hover:to-purple-500 text-white shadow-2xl relative overflow-hidden group border-0"
                >
                  {/* Shimmer effect using CSS */}
                  <div
                    className="shimmer-effect absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                  />

                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Get Started
                    <Rocket className="w-5 h-5" />
                  </span>
                </Button>
              </div>

              <p className="text-center text-slate-500 text-sm mt-4">
                Click to start your journey
              </p>
            </div>
          )}
        </div>

        {/* Corner decorations - simplified */}
        <div className="absolute top-10 left-6 w-16 h-16 border-t-2 border-l-2 border-purple-500/20 rounded-tl-2xl animate-fade-in" style={{ animationDelay: '0.6s' }} />
        <div className="absolute bottom-10 right-6 w-16 h-16 border-b-2 border-r-2 border-pink-500/20 rounded-br-2xl animate-fade-in" style={{ animationDelay: '0.6s' }} />
    </div>
  );
}
