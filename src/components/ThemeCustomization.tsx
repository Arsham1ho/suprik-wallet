import { useState } from 'react';
import { Check, Image as ImageIcon, X, Palette, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useLanguage } from '../utils/i18n/LanguageContext';
import { useTheme, accentColorOptions } from '../utils/ThemeContext';
import chartGrowthImg from 'figma:asset/cf0c640acfd7594fc19f2f68c33b585fb257787d.png';
import circuitBoardImg from 'figma:asset/33819ceff9748d2e7acb552e77a691621fc959ae.png';
import galaxyImg from 'figma:asset/5b4b9e5bc3dce63bd529dad0b6d15398841deffb.png';
import atomImg from 'figma:asset/87f8b32663f196ec1a0eb5a25bdc487bcfefae9d.png';
import techAtomImg from 'figma:asset/5aa70e98ce3aee3ece131f170f241d48a15c7bb9.png';
import cosmicAtomImg from 'figma:asset/6dddf15e38d9de8af29c1069d4e32f01893e25c6.png';
// Custom background images
import purpleSmokeImg from '../assets/purple-smoke-bg.png';
import neonAtomImg from '../assets/neon-atom-bg.png';

interface ThemeCustomizationProps {
  walletId: string;
  onThemeChange?: (theme: string) => void;
}

interface BalanceBackgroundImage {
  id: string;
  name: string;
  url: string;
}

const balanceBackgrounds: BalanceBackgroundImage[] = [
  {
    id: 'none',
    name: 'None',
    url: ''
  },
  {
    id: 'cosmic-atom',
    name: 'Cosmic Atom',
    url: cosmicAtomImg
  },
  {
    id: 'tech-atom',
    name: 'Tech Atom',
    url: techAtomImg
  },
  {
    id: 'atom',
    name: 'Atom',
    url: atomImg
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    url: galaxyImg
  },
  {
    id: 'circuit-board',
    name: 'Circuit Board',
    url: circuitBoardImg
  },
  {
    id: 'chart-growth',
    name: 'Chart Growth',
    url: chartGrowthImg
  },
  {
    id: 'digital-money',
    name: 'Digital Money',
    url: 'https://images.unsplash.com/photo-1694217363951-f922ec85f7e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbW9uZXklMjB0ZWNobm9sb2d5fGVufDF8fHx8MTc2NDUyNjM0Nnww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: 'gemini-dollar',
    name: 'Gemini Dollar',
    url: 'https://i.ibb.co/wNSSLqZL/Gemini-Generated-Image-vhrk9dvhrk9dvhrk.png'
  },
  {
    id: 'bitcoin-stack',
    name: 'Bitcoin Stack',
    url: 'https://cdn.theatlantic.com/thumbor/1QQCcjt02QXBNLgdiLtZL-i1yHU=/0x144:3500x2113/960x540/media/img/mt/2017/11/RTX3KA07/original.jpg'
  },
  {
    id: 'nft-world',
    name: 'NFT World',
    url: 'https://png.pngtree.com/thumb_back/fh260/background/20230704/pngtree-3d-render-of-crypto-currency-and-nft-composition-image_3828737.jpg'
  },
  {
    id: 'multi-coins',
    name: 'Multi Coins',
    url: 'https://media.istockphoto.com/id/1034363382/photo/coins-of-various-cryptocurrencies.jpg?s=612x612&w=0&k=20&c=-ia1tKJeGeoJ7bWN8i6Udzq92MZ9T9vi--OFT6fVsiA='
  },
  {
    id: 'crypto-future',
    name: 'Crypto Future',
    url: 'https://t4.ftcdn.net/jpg/11/97/30/75/360_F_1197307541_NvhbbyeEs6zfVKuT6vtPnwpSIjbosTKW.jpg'
  },
  {
    id: 'solana-purple',
    name: 'Solana Purple',
    url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    id: 'blockchain-network',
    name: 'Blockchain Network',
    url: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    id: 'digital-grid',
    name: 'Digital Grid',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    id: 'abstract-purple',
    name: 'Abstract Purple',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    id: 'neon-city',
    name: 'Neon City',
    url: 'https://images.unsplash.com/photo-1545486332-9e0999c535b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    id: 'space-nebula',
    name: 'Space Nebula',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    id: 'aurora-sky',
    name: 'Aurora Sky',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
  },
  {
    id: 'purple-smoke',
    name: 'Purple Smoke',
    url: purpleSmokeImg
  },
  {
    id: 'neon-atom',
    name: 'Neon Atom',
    url: neonAtomImg
  }
];

export function ThemeCustomization({ onThemeChange }: ThemeCustomizationProps) {
  useLanguage(); // Keep hook for potential future translations
  const { accentColor, setAccentColor, isLightMode, setLightMode } = useTheme();
  const [selectedBackground, setSelectedBackground] = useState<string>(() => {
    return localStorage.getItem('balanceBackground') || 'circuit-board';
  });

  const handleAccentColorSelect = (colorId: string) => {
    setAccentColor(colorId);
    toast.success('Wallet theme updated!');

    if (onThemeChange) {
      onThemeChange(colorId);
    }
  };

  const handleBackgroundSelect = (backgroundId: string) => {
    setSelectedBackground(backgroundId);
    localStorage.setItem('balanceBackground', backgroundId);
    toast.success('Balance background updated!');
  };

  const handleLightModeToggle = () => {
    setLightMode(!isLightMode);
    toast.success(isLightMode ? 'Dark mode enabled!' : 'Light mode enabled!');
  };

  return (
    <div className="space-y-6">
      {/* Balance Background Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <ImageIcon className="w-4 h-4 text-slate-400" />
          <p className="text-slate-400 text-sm">Balance Card Background</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {balanceBackgrounds.map((bg) => (
            <motion.button
              key={bg.id}
              onClick={() => handleBackgroundSelect(bg.id)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                selectedBackground === bg.id
                  ? 'border-white shadow-lg shadow-purple-500/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background Preview */}
              <div className="h-24 relative bg-gradient-to-br from-purple-600 to-blue-600">
                {bg.id === 'none' ? (
                  // None option - show gradient only with X icon
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-800/60 flex items-center justify-center">
                      <X className="w-6 h-6 text-slate-400" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="absolute inset-0 opacity-50"
                      style={{
                        backgroundImage: `url(${bg.url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40" />
                  </>
                )}

                {selectedBackground === bg.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-black" />
                  </motion.div>
                )}
              </div>

              {/* Background Name */}
              <div className="bg-slate-900/80 backdrop-blur-sm p-3">
                <p className="text-white text-sm font-medium text-center">
                  {bg.name}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <p className="text-blue-200 text-xs">
            🖼️ Choose a background image for your Total Balance card on the home screen.
          </p>
        </div>
      </div>

      {/* Accent Color Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Palette className="w-4 h-4 text-slate-400" />
          <p className="text-slate-400 text-sm">Wallet Theme Color</p>
        </div>

        {/* Color swatches in a horizontal scrollable row */}
        <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
          {accentColorOptions.map((color) => {
            const isSelected = accentColor === color.id;
            return (
              <motion.button
                key={color.id}
                onClick={() => handleAccentColorSelect(color.id)}
                className="flex flex-col items-center gap-2 flex-shrink-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Color circle with ring indicator */}
                <div
                  className={`relative w-12 h-12 rounded-full transition-all duration-300 ${
                    isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${color.primary}, ${color.primaryDark})`,
                    boxShadow: isSelected
                      ? `0 0 24px ${color.primary}80, 0 4px 12px ${color.primary}40`
                      : `0 2px 8px ${color.primary}30`,
                  }}
                >
                  {/* Inner shine effect */}
                  <div
                    className="absolute inset-0 rounded-full opacity-60"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${color.accent}80, transparent 60%)`,
                    }}
                  />

                  {/* Checkmark for selected */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Color name */}
                <span
                  className={`text-xs font-medium transition-colors ${
                    isSelected ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {color.name}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Preview card showing the selected color in action */}
        <motion.div
          layout
          className="rounded-xl p-4 border border-slate-800/50"
          style={{
            background: `linear-gradient(135deg, ${
              accentColorOptions.find(c => c.id === accentColor)?.primary || '#9333ea'
            }15, transparent)`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${
                    accentColorOptions.find(c => c.id === accentColor)?.primary || '#9333ea'
                  }, ${
                    accentColorOptions.find(c => c.id === accentColor)?.primaryDark || '#7e22ce'
                  })`,
                }}
              >
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Theme Preview</p>
                <p className="text-slate-400 text-xs">
                  {accentColorOptions.find(c => c.id === accentColor)?.name || 'Purple'} accent
                </p>
              </div>
            </div>
            <motion.div
              className="px-4 py-2 rounded-lg text-white text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${
                  accentColorOptions.find(c => c.id === accentColor)?.primary || '#9333ea'
                }, ${
                  accentColorOptions.find(c => c.id === accentColor)?.primaryDark || '#7e22ce'
                })`,
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Button
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Light/Dark Mode Toggle */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          {isLightMode ? <Sun className="w-4 h-4 text-slate-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          <p className="text-slate-400 text-sm">Display Mode</p>
        </div>

        <motion.button
          onClick={handleLightModeToggle}
          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
            isLightMode
              ? 'bg-amber-50 border-amber-300'
              : 'bg-slate-900/80 border-slate-700 hover:border-slate-600'
          }`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isLightMode
                  ? 'bg-amber-400'
                  : 'bg-slate-800'
              }`}
            >
              {isLightMode ? (
                <Sun className="w-5 h-5 text-white" />
              ) : (
                <Moon className="w-5 h-5 text-slate-300" />
              )}
            </div>
            <div className="text-left">
              <p className={`font-medium ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                {isLightMode ? 'Light Mode' : 'Dark Mode'}
              </p>
              <p className={`text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                {isLightMode ? 'Bright and clear interface' : 'Easy on the eyes'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div
            className={`relative w-14 h-8 rounded-full transition-colors ${
              isLightMode ? 'bg-amber-400' : 'bg-slate-700'
            }`}
          >
            <motion.div
              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
              animate={{ left: isLightMode ? '28px' : '4px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {isLightMode ? (
                <Sun className="w-3 h-3 text-amber-500" />
              ) : (
                <Moon className="w-3 h-3 text-slate-500" />
              )}
            </motion.div>
          </div>
        </motion.button>

        {/* Info */}
        <div className={`border rounded-xl p-3 ${
          isLightMode
            ? 'bg-amber-100/50 border-amber-200'
            : 'bg-blue-500/10 border-blue-500/20'
        }`}>
          <p className={`text-xs ${isLightMode ? 'text-amber-800' : 'text-blue-200'}`}>
            {isLightMode ? '☀️' : '🌙'} {isLightMode ? 'Light mode is currently active. Some pages may not fully support light mode yet.' : 'Dark mode reduces eye strain in low-light conditions.'}
          </p>
        </div>
      </div>
    </div>
  );
}