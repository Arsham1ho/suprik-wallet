import { Home, ArrowLeftRight, Activity, Settings, Orbit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../utils/i18n/LanguageContext';
import { useState } from 'react';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'swap' | 'activity' | 'settings' | 'p2p') => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const { t } = useLanguage();
  const [tappedButton, setTappedButton] = useState<string | null>(null);
  
  const navItems = [
    { id: 'p2p', icon: Orbit, label: 'CosmoPay', gradient: true },
    { id: 'swap', icon: ArrowLeftRight, label: t.nav.swap },
    { id: 'home', icon: Home, label: t.nav.home },
    { id: 'activity', icon: Activity, label: t.nav.activity },
    { id: 'settings', icon: Settings, label: t.nav.settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-slate-900/50 max-w-[430px] mx-auto z-[100] pointer-events-auto">
      <div className="flex items-center justify-between px-2 py-3 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          const isTapped = tappedButton === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => {
                console.log('[BottomNav] Button clicked:', item.id);
                setTappedButton(item.id);
                setTimeout(() => setTappedButton(null), 600);
                onNavigate(item.id as any);
              }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all flex-1 relative pointer-events-auto cursor-pointer ${
                isActive 
                  ? item.gradient 
                    ? 'text-transparent bg-clip-text' 
                    : 'text-purple-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Tap ripple effect */}
              <AnimatePresence>
                {isTapped && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: item.gradient 
                        ? 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(236, 72, 153, 0.3) 50%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                )}
              </AnimatePresence>

              {/* Sparkle particles on tap */}
              <AnimatePresence>
                {isTapped && (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={`particle-${i}`}
                        className="absolute rounded-full"
                        style={{
                          width: 4,
                          height: 4,
                          background: item.gradient 
                            ? `linear-gradient(135deg, #a78bfa, #ec4899, #3b82f6)` 
                            : '#8b5cf6',
                          top: '50%',
                          left: '50%',
                        }}
                        initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                        animate={{ 
                          scale: [0, 1, 0],
                          x: Math.cos((i * Math.PI * 2) / 6) * 30,
                          y: Math.sin((i * Math.PI * 2) / 6) * 30,
                          opacity: [1, 1, 0],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>

              {/* Cosmic glow effect for CosmoPay when active */}
              {isActive && item.gradient && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-xl blur-xl"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
              
              <motion.div
                animate={{
                  y: isActive ? -2 : 0,
                  rotate: isActive && item.gradient ? [0, 360] : 0,
                }}
                transition={{ 
                  y: { type: "spring", stiffness: 300 },
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                }}
                className={isActive && item.gradient ? 'relative z-10' : ''}
              >
                <motion.div
                  animate={
                    isTapped ? (
                      item.id === 'settings' ? {
                        rotate: [0, 180],
                        scale: [1, 1.2, 1]
                      } : item.id === 'home' ? {
                        scale: [1, 1.3, 1],
                        y: [0, -5, 0]
                      } : item.id === 'swap' ? {
                        rotateY: [0, 180, 360],
                        scale: [1, 1.2, 1]
                      } : item.id === 'activity' ? {
                        scale: [1, 1.2, 1.15, 1.2, 1],
                        rotate: [0, -10, 10, -5, 0]
                      } : item.id === 'p2p' ? {
                        scale: [1, 1.3, 1],
                        rotate: [0, 90, 0]
                      } : {}
                    ) : {}
                  }
                  transition={{
                    duration: 0.5,
                    ease: "easeOut"
                  }}
                >
                  <Icon className={`w-6 h-6 ${
                    isActive 
                      ? item.gradient
                        ? 'stroke-purple-500'
                        : 'stroke-[2.5]'
                      : ''
                  }`} />
                </motion.div>
              </motion.div>
              <span className={`text-xs font-semibold relative z-10 ${
                isActive 
                  ? item.gradient
                    ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent'
                    : 'opacity-100'
                  : 'opacity-80'
              }`}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}