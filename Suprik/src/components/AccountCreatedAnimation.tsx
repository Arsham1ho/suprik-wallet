import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, Rocket, Zap, Star } from 'lucide-react';
import { Button } from './ui/button';

interface AccountCreatedAnimationProps {
  onComplete: () => void;
}

export function AccountCreatedAnimation({ onComplete }: AccountCreatedAnimationProps) {
  const [showButton, setShowButton] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [soundPlayed, setSoundPlayed] = useState(false);

  // افکت صوتی موفقیت
  useEffect(() => {
    if (typeof window === 'undefined' || soundPlayed) return;

    const playSuccessSound = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        // صدای موفقیت با آکوردهای خوشایند
        const playChord = (frequencies: number[], startTime: number, duration: number) => {
          frequencies.forEach(freq => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + startTime);

            gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + startTime + 0.05);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime + startTime + duration * 0.7);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + startTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start(audioContext.currentTime + startTime);
            oscillator.stop(audioContext.currentTime + startTime + duration);
          });
        };

        // آکوردهای موفقیت - C Major
        playChord([523.25, 659.25, 783.99], 0, 0.6);    // C5, E5, G5
        playChord([659.25, 783.99, 987.77], 0.2, 0.8);  // E5, G5, B5

        setSoundPlayed(true);
      } catch (error) {
        console.log('Audio not available:', error);
      }
    };

    // تلاش برای پخش فوری
    playSuccessSound();

    // اگر نشد، با اولین تعامل کاربر
    const startAudio = () => {
      playSuccessSound();
      document.removeEventListener('click', startAudio);
      document.removeEventListener('touchstart', startAudio);
    };

    document.addEventListener('click', startAudio, { once: true });
    document.addEventListener('touchstart', startAudio, { once: true });

    return () => {
      document.removeEventListener('click', startAudio);
      document.removeEventListener('touchstart', startAudio);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [soundPlayed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Memoize particles to prevent recreation on every render
  const particles = useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      key: i,
      width: Math.random() * 4 + 2,
      height: Math.random() * 4 + 2,
      initialX: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 500),
      finalX: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 500),
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 overflow-hidden relative">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
            willChange: 'transform',
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: 'linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Nebula Effect - سحابی */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* پس‌زمینه سحابی با gradient های چند لایه */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 800px 400px at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 600px 500px at 80% 70%, rgba(236, 72, 153, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 500px 600px at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
            `,
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* ستاره‌های چشمک‌زن */}
        {[...Array(50)].map((_, i) => {
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const size = Math.random() * 2 + 0.5;
          const duration = Math.random() * 3 + 2;
          const delay = Math.random() * 5;
          
          return (
            <motion.div
              key={`star-${i}`}
              className="absolute rounded-full bg-white"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${size}px`,
                height: `${size}px`,
                boxShadow: `0 0 ${size * 2}px rgba(255, 255, 255, 0.8)`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: duration,
                delay: delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        })}
        
        {/* شهاب‌سنگ‌های متحرک */}
        {[...Array(5)].map((_, i) => {
          const startY = Math.random() * 50;
          const duration = Math.random() * 2 + 1.5;
          const delay = i * 3 + Math.random() * 2;
          
          return (
            <motion.div
              key={`shooting-star-${i}`}
              className="absolute"
              style={{
                left: '-100px',
                top: `${startY}%`,
                width: '100px',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
                boxShadow: '0 0 10px rgba(139, 92, 246, 0.6), 0 0 20px rgba(236, 72, 153, 0.4)',
                transform: 'rotate(-45deg)',
              }}
              animate={{
                x: ['0vw', '120vw'],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: duration,
                delay: delay,
                repeat: Infinity,
                repeatDelay: 8,
                ease: "easeOut",
              }}
            />
          );
        })}
        
        {/* سیاره‌های کوچک شناور */}
        {[
          { color: 'rgba(139, 92, 246, 0.3)', size: 40, x: 10, y: 20 },
          { color: 'rgba(236, 72, 153, 0.3)', size: 30, x: 85, y: 70 },
          { color: 'rgba(59, 130, 246, 0.25)', size: 25, x: 75, y: 15 },
        ].map((planet, i) => (
          <motion.div
            key={`planet-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${planet.x}%`,
              top: `${planet.y}%`,
              width: `${planet.size}px`,
              height: `${planet.size}px`,
              background: `radial-gradient(circle at 30% 30%, ${planet.color}, transparent)`,
              border: `1px solid ${planet.color}`,
              boxShadow: `0 0 ${planet.size}px ${planet.color}`,
            }}
            animate={{
              y: [-10, 10, -10],
              x: [-5, 5, -5],
              rotate: [0, 360],
            }}
            transition={{
              duration: 15 + i * 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Optimized orbiting particles - reduced from 30 to 15 */}
      {particles.map((particle) => (
        <motion.div
          key={particle.key}
          className="absolute"
          style={{
            width: particle.width,
            height: particle.height,
            willChange: 'transform, opacity',
          }}
          initial={{
            x: particle.initialX,
            y: typeof window !== 'undefined' ? window.innerHeight + 50 : 600,
            opacity: 0,
          }}
          animate={{
            y: -50,
            opacity: [0, 1, 1, 0],
            x: particle.finalX,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-[1px]" />
        </motion.div>
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Success icon container */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            duration: 0.8,
          }}
          className="relative mb-12"
        >
          {/* Pulsing rings */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-purple-500/30"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: [1, 2, 2.5], opacity: [0.5, 0.2, 0] }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
                ease: "easeOut",
              }}
              style={{
                width: 160,
                height: 160,
                left: -20,
                top: -20,
                willChange: 'transform, opacity',
              }}
            />
          ))}

          {/* Rotating gradient ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              width: 140,
              height: 140,
              left: -10,
              top: -10,
              background: 'conic-gradient(from 0deg, transparent, #8b5cf6, #ec4899, #3b82f6, transparent)',
              willChange: 'transform',
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              width: 120,
              height: 120,
              willChange: 'transform, opacity',
            }}
          />

          {/* Main checkmark circle */}
          <motion.div 
            className="relative w-[120px] h-[120px] rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 flex items-center justify-center shadow-2xl"
            animate={{
              boxShadow: [
                '0 0 40px rgba(139, 92, 246, 0.5)',
                '0 0 60px rgba(236, 72, 153, 0.7)',
                '0 0 40px rgba(139, 92, 246, 0.5)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.3,
              }}
            >
              <CheckCircle2 className="w-16 h-16 text-white" strokeWidth={3} />
            </motion.div>
          </motion.div>

          {/* Orbiting icons */}
          {[
            { Icon: Sparkles, delay: 0, color: 'text-yellow-400', angle: 0 },
            { Icon: Star, delay: 0.2, color: 'text-pink-400', angle: 120 },
            { Icon: Zap, delay: 0.4, color: 'text-blue-400', angle: 240 },
          ].map(({ Icon, delay, color, angle }, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                willChange: 'transform, opacity',
              }}
              initial={{ x: '-50%', y: '-50%', scale: 0, opacity: 0 }}
              animate={{
                x: `calc(-50% + ${Math.cos((angle + 360 * (i / 3)) * Math.PI / 180) * 80}px)`,
                y: `calc(-50% + ${Math.sin((angle + 360 * (i / 3)) * Math.PI / 180) * 80}px)`,
                scale: [0, 1.2, 1],
                opacity: [0, 1, 1],
                rotate: [0, 360],
              }}
              transition={{
                delay: delay + 0.5,
                duration: 0.6,
                rotate: {
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
            >
              <div className={`${color} drop-shadow-lg`}>
                <Icon className="w-6 h-6" fill="currentColor" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Success text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center space-y-4 mb-12"
        >
          <h1 className="text-4xl bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Welcome to Suprik!
          </h1>
          
          <motion.p 
            className="text-slate-400 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Your wallet is ready to explore the universe
          </motion.p>

          {/* Feature badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-wrap justify-center gap-2 mt-6"
          >
            {['Secure', 'Fast', 'Easy'].map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.2 + i * 0.1 }}
                className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm"
              >
                {feature}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Get Started button - optimized to prevent rebuilds */}
        <AnimatePresence mode="wait">
          {showButton && (
            <motion.div
              key="get-started-button"
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              className="w-full"
            >
              <div className="relative w-full">
                {/* Static shimmer effect using CSS animation */}
                <style>{`
                  @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                  }
                  .shimmer-effect {
                    animation: shimmer 2s linear infinite;
                  }
                `}</style>
                
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

              {/* Skip text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center text-slate-500 text-sm mt-4"
              >
                Click to start your journey
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Corner decorations */}
      <motion.div
        className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-purple-500/20 rounded-tl-3xl"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      />
      <motion.div
        className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-pink-500/20 rounded-br-3xl"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      />
    </div>
  );
}