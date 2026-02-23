import { Wallet, Shield, Zap, Lock, Wand2, ArrowRight, Check, KeyRound } from 'lucide-react';
const logo = '/sup_logo.png';

interface LandingProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

export function Landing({ onCreateWallet, onImportWallet }: LandingProps) {
  return (
    <div
      className="text-white relative select-none flex flex-col min-h-screen"
      style={{
        width: '100%',
        height: '100vh',
        minHeight: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitOverflowScrolling: 'touch',
        background: 'linear-gradient(180deg, #08061a 0%, #0a0818 40%, #060510 100%)',
      }}
    >
      {/* Connected dots grid background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <style>{`
          @keyframes gridPulse { 0%, 100% { opacity: 0.13; } 50% { opacity: 0.2; } }
          @keyframes gridPulse2 { 0%, 100% { opacity: 0.05; } 50% { opacity: 0.09; } }
          @keyframes glowOrbit {
            0% { top: -15%; left: -15%; }
            25% { top: -10%; left: 70%; }
            50% { top: 70%; left: 60%; }
            75% { top: 60%; left: -10%; }
            100% { top: -15%; left: -15%; }
          }
        `}</style>
        {/* Primary network grid — dots + orthogonal + diagonal lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><line x1='0' y1='0' x2='50' y2='0' stroke='rgba(139,92,246,1)' stroke-width='0.3'/><line x1='0' y1='0' x2='0' y2='50' stroke='rgba(139,92,246,1)' stroke-width='0.3'/><line x1='0' y1='0' x2='25' y2='25' stroke='rgba(139,92,246,1)' stroke-width='0.2'/><line x1='25' y1='25' x2='50' y2='0' stroke='rgba(139,92,246,1)' stroke-width='0.2'/><line x1='25' y1='25' x2='0' y2='50' stroke='rgba(139,92,246,1)' stroke-width='0.2'/><line x1='25' y1='25' x2='50' y2='50' stroke='rgba(139,92,246,1)' stroke-width='0.2'/><circle cx='0' cy='0' r='1.5' fill='rgba(139,92,246,1)'/><circle cx='25' cy='25' r='1' fill='rgba(139,92,246,0.7)'/></svg>`)}")`,
          animation: 'gridPulse 6s ease-in-out infinite',
          opacity: 0.13,
        }} />
        {/* Secondary grid — smaller, offset for depth */}
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50'><line x1='0' y1='0' x2='50' y2='0' stroke='rgba(99,102,241,1)' stroke-width='0.2'/><line x1='0' y1='0' x2='0' y2='50' stroke='rgba(99,102,241,1)' stroke-width='0.2'/><circle cx='0' cy='0' r='1' fill='rgba(99,102,241,0.8)'/></svg>`)}")`,
          backgroundSize: '35px 35px',
          backgroundPosition: '17px 17px',
          animation: 'gridPulse2 9s ease-in-out infinite',
          opacity: 0.05,
        }} />
        {/* Orbiting glow spot */}
        <div className="absolute" style={{ width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 60%)', filter: 'blur(60px)', animation: 'glowOrbit 18s ease-in-out infinite' }} />
        {/* Center glow behind logo */}
        <div className="absolute" style={{ top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(88,28,135,0.06) 40%, transparent 70%)', filter: 'blur(40px)' }} />
        {/* Fade at top edge */}
        <div className="absolute top-0 left-0 right-0" style={{ height: '12%', background: 'linear-gradient(to bottom, #08061a, transparent)', zIndex: 1 }} />
        {/* Fade at bottom edge */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '12%', background: 'linear-gradient(to top, #060510, transparent)', zIndex: 1 }} />
      </div>

        {/* Content */}
        <div className="flex flex-col px-6 py-6 relative z-10 landing-page-content">
          {/* Hero Section */}
          <div className="flex flex-col items-center justify-start pt-4">
            {/* Logo */}
            <div className="relative mb-6 select-none pointer-events-none">
              {/* Soft glow behind logo */}
              <div
                className="absolute inset-0 -m-6 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />

              <div
                className="relative w-32 h-32 flex items-center justify-center"
                style={{
                  borderRadius: '50%',
                  overflow: 'hidden',
                  clipPath: 'circle(50%)',
                  WebkitClipPath: 'circle(50%)',
                  transform: 'translateZ(0)',
                  WebkitTransform: 'translateZ(0)',
                }}
              >
                <img
                  src={logo}
                  alt="Suprik Logo"
                  className="w-32 h-32"
                  style={{
                    borderRadius: '50%',
                    display: 'block',
                  }}
                />
              </div>
            </div>

            {/* Brand & Tagline */}
            <div className="text-center mb-8">
              <h1
                className="text-6xl font-bold mb-3 select-none tracking-tight"
                style={{ color: '#c4b5fd' }}
              >
                Suprik
              </h1>
              <p className="text-white/85 mb-2 select-none text-[15px]">
                The friendly crypto wallet
              </p>
              <p className="text-sm text-slate-500 select-none">
                Buy, store, send and swap tokens
              </p>
            </div>

            {/* Feature Highlights - 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-[380px] mb-10">
              {[
                { icon: Shield, text: 'Secure' },
                { icon: Zap, text: 'Fast' },
                { icon: Lock, text: 'Private' },
                { icon: Wand2, text: 'Easy' },
              ].map((feature) => (
                <div
                  key={feature.text}
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl backdrop-blur-sm select-none"
                  style={{
                    background: 'rgba(15, 10, 26, 0.6)',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                  }}
                >
                  <feature.icon className="w-5 h-5 text-purple-400/80 flex-shrink-0" />
                  <span className="text-slate-300 text-[15px]">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div
            className="space-y-3 pb-8 mt-auto"
            style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
          >
            {/* Create Wallet */}
            <button
              onClick={onCreateWallet}
              className="w-full h-14 rounded-2xl font-semibold select-none relative overflow-hidden transition-transform active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                touchAction: 'manipulation',
                boxShadow: '0 8px 32px rgba(124, 58, 237, 0.3)',
              }}
            >
              <span className="flex items-center justify-center gap-2.5 select-none text-white">
                <Wallet className="w-5 h-5" />
                Create New Wallet
                <ArrowRight className="w-4 h-4 opacity-60" />
              </span>
            </button>

            {/* Import Wallet */}
            <button
              onClick={onImportWallet}
              className="w-full h-14 rounded-2xl text-white transition-all active:scale-[0.97] select-none"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                touchAction: 'manipulation',
              }}
            >
              <span className="flex items-center justify-center gap-2.5">
                <KeyRound className="w-5 h-5 opacity-50" />
                I already have a wallet
              </span>
            </button>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-2 pt-2 select-none">
              <Check className="w-4 h-4 text-purple-400/60" />
              <span className="text-xs text-slate-500">
                Trusted by Community
              </span>
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-slate-600 select-none pt-1">
              By continuing, you agree to our{' '}
              <a href="https://www.suprik.com/terms" target="_blank" rel="noopener noreferrer" className="text-slate-500 underline cursor-pointer">Terms of Service</a>
            </p>
          </div>
        </div>
    </div>
  );
}
