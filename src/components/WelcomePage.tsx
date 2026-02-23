import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useMemo } from 'react';
import { ChevronRight, Fingerprint, ArrowLeftRight, BrainCircuit } from 'lucide-react';

interface WelcomePageProps {
  onContinue: () => void;
}

const FEATURES = [
  {
    icon: Fingerprint,
    title: 'Secure & Private',
    desc: 'Your keys never leave your device',
  },
  {
    icon: ArrowLeftRight,
    title: 'Instant Swaps',
    desc: 'Trade tokens in seconds',
  },
  {
    icon: BrainCircuit,
    title: 'AI-Powered',
    desc: 'Smart portfolio insights',
  },
];

// Pre-computed particle positions to avoid re-renders
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

export function WelcomePage({ onContinue }: WelcomePageProps) {
  const [phase, setPhase] = useState<'splash' | 'content'>('splash');
  const particles = useMemo(() => PARTICLE_POSITIONS, []);

  useEffect(() => {
    const orig = {
      overflow: document.body.style.overflow,
      touchAction: document.body.style.touchAction,
      userSelect: document.body.style.userSelect,
      position: document.body.style.position,
    };
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.userSelect = 'none';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    const timer = setTimeout(() => {
      setPhase('content');
      document.body.style.overflow = orig.overflow;
      document.body.style.touchAction = orig.touchAction;
      document.body.style.userSelect = orig.userSelect;
      document.body.style.position = orig.position;
      document.body.style.width = '';
      document.body.style.height = '';
    }, 1800);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = orig.overflow;
      document.body.style.touchAction = orig.touchAction;
      document.body.style.userSelect = orig.userSelect;
      document.body.style.position = orig.position;
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  const isSplash = phase === 'splash';

  return (
    <div
      className="text-white flex flex-col overflow-hidden relative select-none"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100%',
        touchAction: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        overscrollBehavior: 'none',
        background: 'black',
      }}
    >
      {/* Background - Central purple glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.5 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              y: [0, -50],
            }}
            transition={{
              duration: 1.5,
              delay: particle.delay,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-sm flex flex-col items-center">

          {/* Logo icon */}
          <motion.div
            className="mb-8 relative"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          >
            {/* Glow pulse */}
            <motion.div
              className="absolute inset-0 -m-8 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                filter: 'blur(24px)',
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Expanding ring (splash phase) */}
            <AnimatePresence>
              {isSplash && (
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full"
                  style={{ border: '1.5px solid rgba(139, 92, 246, 0.35)' }}
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, ease: 'easeOut', delay: 0.2 }}
                />
              )}
            </AnimatePresence>

            {/* Splash: circular logo, Content: shield icon */}
            {isSplash ? (
              <motion.div
                className="relative w-32 h-32 rounded-full overflow-hidden"
                style={{ filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))' }}
              >
                <img
                  src="/sup_logo.png"
                  alt="Suprik"
                  className="w-full h-full"
                  style={{ borderRadius: '50%', display: 'block' }}
                  draggable={false}
                />
              </motion.div>
            ) : (
              <motion.div
                className="relative w-[120px] h-[120px] rounded-full flex items-center justify-center"
                style={{
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.5))',
                }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img
                  src="/suprik-shield.png"
                  alt="Suprik"
                  width={80}
                  height={80}
                  className="relative"
                  draggable={false}
                />
              </motion.div>
            )}
          </motion.div>

          {/* Animated gradient text */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center"
            style={{ marginBottom: isSplash ? 0 : 32, transition: 'margin 0.6s ease' }}
          >
            <h1 className="text-[2.5rem] font-bold tracking-tight leading-tight mb-1.5">
              <span className="text-white">Welcome to </span>
              <span style={{ color: '#c4b5fd' }}>
                Suprik
              </span>
            </h1>
            <motion.p
              className="text-slate-400 text-[15px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: isSplash ? 0.6 : 1 }}
              transition={{ delay: 0.5 }}
            >
              {isSplash ? 'Crypto Wallet' : 'Your gateway to the decentralized future'}
            </motion.p>

            {/* Loading dots — splash only */}
            <AnimatePresence>
              {isSplash && (
                <motion.div
                  className="flex items-center justify-center gap-1.5 mt-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'rgba(139, 92, 246, 0.6)' }}
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 0.9, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Feature cards — content phase */}
          <AnimatePresence>
            {!isSplash && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full space-y-2.5 mb-8"
              >
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.4, ease: 'easeOut' }}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(139, 92, 246, 0.1)' }}
                    >
                      <f.icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[15px] font-medium text-white">{f.title}</p>
                      <p className="text-[13px] text-slate-500">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA button — content phase */}
          <AnimatePresence>
            {!isSplash && (
              <motion.button
                onClick={onContinue}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                whileTap={{ scale: 0.97 }}
                className="w-full h-14 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 group relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  boxShadow: '0 8px 32px rgba(124, 58, 237, 0.35)',
                  touchAction: 'manipulation',
                }}
              >
                {/* Shimmer sweep */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                    backgroundSize: '200% 100%',
                  }}
                  animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                />
                <span className="text-[16px] relative z-10">Get Started</span>
                <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-0.5 transition-transform relative z-10" />
              </motion.button>
            )}
          </AnimatePresence>
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
  );
}
