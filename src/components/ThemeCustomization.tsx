import { useState } from 'react';
import { Check, Image as ImageIcon, X } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useLanguage } from '../utils/i18n/LanguageContext';
import { useTheme } from '../utils/ThemeContext';
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

interface Theme {
  id: string;
  name: string;
  gradient: string;
  preview: string;
}

interface BalanceBackgroundImage {
  id: string;
  name: string;
  url: string;
}

const themes: Theme[] = [
  {
    id: 'classic',
    name: 'Classic Purple',
    gradient: 'from-purple-600 to-blue-600',
    preview: 'bg-gradient-to-r from-purple-600 to-blue-600',
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    gradient: 'from-blue-900 to-indigo-900',
    preview: 'bg-gradient-to-r from-blue-900 to-indigo-900',
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    gradient: 'from-orange-500 to-pink-600',
    preview: 'bg-gradient-to-r from-orange-500 to-pink-600',
  },
  {
    id: 'forest',
    name: 'Forest Green',
    gradient: 'from-emerald-600 to-teal-600',
    preview: 'bg-gradient-to-r from-emerald-600 to-teal-600',
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    gradient: 'from-cyan-500 to-blue-500',
    preview: 'bg-gradient-to-r from-cyan-500 to-blue-500',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    gradient: 'from-purple-500 via-pink-500 to-blue-500',
    preview: 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500',
  },
  {
    id: 'fire',
    name: 'Fire',
    gradient: 'from-red-600 to-yellow-500',
    preview: 'bg-gradient-to-r from-red-600 to-yellow-500',
  },
  {
    id: 'neon',
    name: 'Neon',
    gradient: 'from-green-400 to-cyan-400',
    preview: 'bg-gradient-to-r from-green-400 to-cyan-400',
  },
];

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

// Theme to background mapping - each theme has a default background
const themeBackgroundMapping: { [key: string]: string } = {
  'classic': 'cosmic-atom',      // Classic Purple → Cosmic Atom
  'midnight': 'galaxy',          // Midnight Blue → Galaxy
  'sunset': 'chart-growth',      // Sunset Orange → Chart Growth
  'forest': 'circuit-board',     // Forest Green → Circuit Board
  'ocean': 'tech-atom',          // Ocean Blue → Tech Atom
  'aurora': 'atom',              // Aurora → Atom
  'fire': 'bitcoin-stack',       // Fire → Bitcoin Stack
  'neon': 'nft-world'            // Neon → NFT World
};

export function ThemeCustomization({ onThemeChange }: ThemeCustomizationProps) {
  const { t } = useLanguage();
  const { setTheme } = useTheme();
  const [selectedBackground, setSelectedBackground] = useState<string>(() => {
    return localStorage.getItem('balanceBackground') || 'circuit-board';
  });

  // Theme selection is now client-side only (saved via ThemeContext to localStorage)
  const handleThemeSelect = (themeId: string) => {
    // Update theme in context (saves to localStorage automatically)
    setTheme(themeId);

    // Auto-update balance background based on theme
    const newBackground = themeBackgroundMapping[themeId] || 'atom';
    setSelectedBackground(newBackground);
    localStorage.setItem('balanceBackground', newBackground);

    toast.success(t.messages.success.settingsUpdated);

    if (onThemeChange) {
      onThemeChange(themeId);
    }
  };

  const handleBackgroundSelect = (backgroundId: string) => {
    setSelectedBackground(backgroundId);
    localStorage.setItem('balanceBackground', backgroundId);
    toast.success('Balance background updated!');
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

      {/* Theme Selection - REMOVED */}
    </div>
  );
}