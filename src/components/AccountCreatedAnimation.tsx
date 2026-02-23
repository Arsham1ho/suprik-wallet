import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';

interface AccountCreatedAnimationProps {
  onComplete: () => void;
}

const PARTICLE_POSITIONS = [
  { left: 15, top: 20, delay: 0.1 },
  { left: 85, top: 15, delay: 0.3 },
  { left: 25, top: 70, delay: 0.5 },
  { left: 75, top: 80, delay: 0.2 },
  { left: 10, top: 45, delay: 0.7 },
  { left: 90, top: 55, delay: 0.4 },
  { left: 50, top: 10, delay: 0.6 },
  { left: 35, top: 90, delay: 0.8 },
  { left: 65, top: 35, delay: 0.9 },
  { left: 45, top: 60, delay: 0.15 },
];

export function AccountCreatedAnimation({ onComplete }: AccountCreatedAnimationProps) {
  const [showButton, setShowButton] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const particles = useMemo(() => PARTICLE_POSITIONS, []);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setShowButton(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="text-white relative flex flex-col items-center justify-center px-6 select-none"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
        overflowX: 'hidden',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        backgroundColor: '#000000',
      }}
    >
      <style>{`
        @keyframes acPulseRing {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes acPulseRing2 {
          0% { transform: scale(1); opacity: 0.2; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes acFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes acScaleIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes acGlow {
          0%, 100% { box-shadow: 0 0 40px rgba(139, 92, 246, 0.5); }
          50% { box-shadow: 0 0 60px rgba(139, 92, 246, 0.7); }
        }
        @keyframes acShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes acParticle {
          0% { opacity: 0; transform: scale(0) translateY(0); }
          50% { opacity: 1; transform: scale(1.5) translateY(-25px); }
          100% { opacity: 0; transform: scale(0) translateY(-50px); }
        }
      `}</style>

      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animation: `acParticle 1.5s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div
        className={`relative z-10 flex flex-col items-center w-full max-w-sm transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Success icon */}
        <div className="relative mb-10" style={{ animation: 'acScaleIn 0.5s ease-out forwards' }}>
          {/* Pulsing rings */}
          <div
            className="absolute rounded-full border-2 border-purple-500/30"
            style={{
              width: 160, height: 160, left: -20, top: -20,
              animation: 'acPulseRing 2s ease-out infinite',
            }}
          />
          <div
            className="absolute rounded-full border border-purple-500/15"
            style={{
              width: 160, height: 160, left: -20, top: -20,
              animation: 'acPulseRing2 2s ease-out infinite 0.6s',
            }}
          />

          {/* Main circle */}
          <div
            className="relative w-[120px] h-[120px] rounded-full bg-purple-600 flex items-center justify-center"
            style={{ animation: 'acGlow 2.5s ease-in-out infinite' }}
          >
            <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Title */}
        <div
          className="text-center space-y-3 mb-8"
          style={{ animation: 'acFadeIn 0.5s ease-out 0.2s both' }}
        >
          <h1 className="text-3xl font-bold" style={{ color: '#c4b5fd' }}>
            Welcome to Suprik!
          </h1>
          <p className="text-slate-400 text-[15px]">
            Your wallet is ready to explore the universe
          </p>
        </div>

        {/* Get Started button */}
        {showButton && (
          <div className="w-full" style={{ animation: 'acFadeIn 0.5s ease-out forwards' }}>
            <button
              onClick={onComplete}
              className="w-full h-14 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                boxShadow: '0 8px 32px rgba(124, 58, 237, 0.35)',
                touchAction: 'manipulation',
              }}
            >
              {/* Shimmer sweep */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                  backgroundSize: '200% 100%',
                  animation: 'acShimmer 2.5s ease-in-out infinite 1.5s',
                }}
              />
              <span className="text-[16px] relative z-10">Get Started</span>
              <ChevronRight className="w-5 h-5 opacity-70 relative z-10" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
