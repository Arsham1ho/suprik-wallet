import { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Globe, DollarSign, Languages } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useLanguage } from '../../utils/i18n/LanguageContext';
import { getUserSettings } from '../../utils/userSettings';

interface PreferencesSettingsProps {
  onBack: () => void;
  walletId: string;
}

interface UserSettings {
  language: string;
  currency: string;
  usePassword: boolean;
  password?: string;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fa', name: 'فارسی (Persian)', flag: '🇮🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
  { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko', name: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский (Russian)', flag: '🇷🇺' },
  { code: 'tr', name: 'Türkçe (Turkish)', flag: '🇹🇷' },
];

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
];

export function PreferencesSettings({ onBack, walletId }: PreferencesSettingsProps) {
  const { t, setLanguage, setCurrency } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    language: 'en',
    currency: 'USD',
    usePassword: false,
  });

  useEffect(() => {
    loadUserSettings();
  }, [walletId]);

  // Load settings from localStorage (client-side, instant)
  const loadUserSettings = () => {
    try {
      console.log('[PreferencesSettings] Loading from localStorage (client-side)...');
      const settings = getUserSettings(walletId);
      setUserSettings({
        language: settings.language || 'en',
        currency: settings.currency || 'USD',
        usePassword: false,
      });
      console.log('[PreferencesSettings] ✅ Settings loaded');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update settings via context (which saves to localStorage)
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    try {
      const updatedSettings = { ...userSettings, ...newSettings };

      // Update context (which saves to localStorage automatically)
      if (newSettings.language) {
        setLanguage(newSettings.language);
      }
      if (newSettings.currency) {
        setCurrency(newSettings.currency);
      }

      setUserSettings(updatedSettings);
      toast.success(t.messages.success.settingsUpdated);
      console.log('[PreferencesSettings] ✅ Settings saved (client-side)');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(t.messages.error.saveFailed);
    }
  };

  const selectedLanguage = languages.find(l => l.code === userSettings.language);
  const selectedCurrency = currencies.find(c => c.code === userSettings.currency);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-lg border-b border-slate-800/50">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl">{t.settings.preferences}</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Current Settings Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-medium">{t.settings.currentSettings}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-xs mb-1">{t.settings.language}</p>
              <p className="text-white text-sm">{selectedLanguage?.flag} {selectedLanguage?.name}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">{t.settings.currency}</p>
              <p className="text-white text-sm">{selectedCurrency?.symbol} {selectedCurrency?.name}</p>
            </div>
          </div>
        </motion.div>

        {/* Language Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3 bg-slate-900/50 rounded-xl p-4 border border-slate-800/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <Languages className="w-5 h-5 text-purple-400" />
            <Label className="text-white">{t.settings.displayLanguage}</Label>
          </div>
          <p className="text-slate-400 text-sm mb-3">
            {t.settings.chooseLanguage}
          </p>

          <Select
            value={userSettings.language}
            onValueChange={(value) => updateSettings({ language: value })}
          >
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-12">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span>{selectedLanguage?.flag}</span>
                  <span>{selectedLanguage?.name}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {languages.map((lang) => (
                <SelectItem
                  key={lang.code}
                  value={lang.code}
                  className="text-white hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Currency Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 bg-slate-900/50 rounded-xl p-4 border border-slate-800/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <Label className="text-white">{t.settings.primaryCurrency}</Label>
          </div>
          <p className="text-slate-400 text-sm mb-3">
            {t.settings.chooseCurrency}
          </p>

          <Select
            value={userSettings.currency}
            onValueChange={(value) => updateSettings({ currency: value })}
          >
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-12">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <span>{selectedCurrency?.symbol}</span>
                  <span>{selectedCurrency?.name}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              {currencies.map((curr) => (
                <SelectItem
                  key={curr.code}
                  value={curr.code}
                  className="text-white hover:bg-slate-800"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{curr.name}</span>
                    <span className="text-slate-400 ml-2">({curr.symbol})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4"
        >
          <p className="text-blue-300 text-sm">
            Your preferences are saved locally on this device for instant access.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
