import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../utils/i18n/LanguageContext';
import { useTheme } from '../utils/ThemeContext';

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

export function ThemeCustomization({ walletId, onThemeChange }: ThemeCustomizationProps) {
  const { t } = useLanguage();
  const { theme: currentTheme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleThemeSelect = async (themeId: string) => {
    try {
      setLoading(true);
      
      // Update theme in context immediately for instant feedback
      setTheme(themeId);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet/${walletId}/theme`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ theme: themeId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save theme');
      }

      toast.success(t.messages.success.settingsUpdated);
      
      if (onThemeChange) {
        onThemeChange(themeId);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error(t.messages.error.saveFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm px-2">{t.theme.chooseTheme}</p>
      
      <div className="grid grid-cols-2 gap-3">
        {themes.map((theme) => (
          <motion.button
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            disabled={loading}
            className={`relative rounded-xl overflow-hidden border-2 transition-all ${
              currentTheme === theme.id
                ? 'border-white shadow-lg shadow-purple-500/20'
                : 'border-slate-800 hover:border-slate-700'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {/* Theme Preview */}
            <div className={`h-24 ${theme.preview} relative`}>
              {currentTheme === theme.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-black" />
                </motion.div>
              )}
            </div>

            {/* Theme Name */}
            <div className="bg-slate-900/80 backdrop-blur-sm p-3">
              <p className="text-white text-sm font-medium text-center">
                {(t.theme as any)[theme.id] || theme.name}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Info */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mt-4">
        <p className="text-purple-200 text-xs">
          💡 {t.theme.themeCustomization} will change the app's color scheme and gradient effects.
        </p>
      </div>
    </div>
  );
}
