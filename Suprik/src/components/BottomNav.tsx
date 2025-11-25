import { Home, ArrowLeftRight, Activity, Settings, Orbit } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../utils/i18n/LanguageContext';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'swap' | 'activity' | 'settings' | 'p2p') => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const { t } = useLanguage();
  
  const navItems = [
    { id: 'p2p', icon: Orbit, label: 'CosmoPay', gradient: true },
    { id: 'swap', icon: ArrowLeftRight, label: t.nav.swap },
    { id: 'home', icon: Home, label: t.nav.home },
    { id: 'activity', icon: Activity, label: t.nav.activity },
    { id: 'settings', icon: Settings, label: t.nav.settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-slate-900/50 max-w-[430px] mx-auto">
      <div className="flex items-center justify-between px-2 py-3 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all flex-1 relative ${
                isActive 
                  ? item.gradient 
                    ? 'text-transparent bg-clip-text' 
                    : 'text-purple-500'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
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
                <Icon className={`w-6 h-6 ${
                  isActive 
                    ? item.gradient
                      ? 'stroke-purple-500'
                      : 'stroke-[2.5]'
                    : ''
                }`} />
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