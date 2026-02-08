import { Home, ArrowLeftRight, Activity, Settings, Orbit } from 'lucide-react';
import { useLanguage } from '../utils/i18n/LanguageContext';
import { useTheme } from '../utils/ThemeContext';
import { toast } from 'sonner';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'swap' | 'activity' | 'settings' | 'p2p') => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();

  const navItems = [
    { id: 'p2p', icon: Orbit, label: 'SuprikPay', gradient: true },
    { id: 'swap', icon: ArrowLeftRight, label: t.nav.swap },
    { id: 'home', icon: Home, label: t.nav.home },
    { id: 'activity', icon: Activity, label: t.nav.activity },
    { id: 'settings', icon: Settings, label: t.nav.settings },
  ];

  return (
    <div className="wallet-bottom-nav fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-slate-900/50 w-full z-[100]">
      <div className="flex items-center justify-between px-2 py-3 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'p2p') {
                  toast('Coming Soon!', {
                    description: 'Suprik Pay will be available in a future update.',
                    icon: '🚀',
                  });
                  return;
                }
                onNavigate(item.id as any);
              }}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-150 flex-1 active:scale-95 ${
                isActive
                  ? item.gradient
                    ? 'text-transparent bg-clip-text'
                    : 'text-theme-accent'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={isActive ? 'transform -translate-y-0.5' : ''}>
                <Icon
                  className={`w-6 h-6 ${
                    isActive
                      ? item.gradient
                        ? 'stroke-purple-500'
                        : 'stroke-[2.5]'
                      : ''
                  }`}
                  style={isActive && !item.gradient ? { stroke: colors.accent } : undefined}
                />
              </div>
              <span className={`text-xs font-semibold ${
                isActive
                  ? item.gradient
                    ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent'
                    : 'opacity-100'
                  : 'opacity-80'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
