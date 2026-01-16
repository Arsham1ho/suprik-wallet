import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Translations } from './translations';
import {
  getUserSettings,
  saveUserSettings,
  getExchangeRates,
  fetchExchangeRates,
} from '../userSettings';

interface CurrencyRates {
  [key: string]: number;
}

interface LanguageContextType {
  language: string;
  currency: string;
  t: Translations;
  setLanguage: (lang: string) => void;
  setCurrency: (curr: string) => void;
  formatPrice: (amount: number, symbol?: string) => string;
  convertPrice: (amount: number, fromCurrency?: string) => number;
  isRTL: boolean;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const RTL_LANGUAGES = ['fa', 'ar'];

export function LanguageProvider({
  children,
  walletId
}: {
  children: ReactNode;
  walletId: string | null;
}) {
  const [language, setLanguageState] = useState('en');
  const [currency, setCurrencyState] = useState('USD');
  const [rates, setRates] = useState<CurrencyRates>({ USD: 1 });
  const [loading, setLoading] = useState(true);

  // Load user settings from localStorage (client-side, instant)
  useEffect(() => {
    try {
      console.log('[Language] Loading settings from localStorage (client-side)...');
      const settings = getUserSettings(walletId || undefined);
      setLanguageState(settings.language || 'en');
      setCurrencyState(settings.currency || 'USD');
      console.log('[Language] ✅ Settings loaded:', settings.language, settings.currency);
    } catch (error) {
      console.warn('[Language] Error loading settings, using defaults');
    } finally {
      setLoading(false);
    }
  }, [walletId]);

  // Load exchange rates (client-side with caching)
  useEffect(() => {
    const loadRates = async () => {
      try {
        // First load cached rates instantly
        const cachedRates = getExchangeRates();
        setRates(cachedRates);

        // Then fetch fresh rates in background
        const freshRates = await fetchExchangeRates();
        setRates(freshRates);
        console.log('[Language] ✅ Exchange rates loaded (client-side)');
      } catch (error) {
        console.warn('[Language] Exchange rates fetch failed, using cached/fallback');
      }
    };

    loadRates();
    // Reload rates every hour
    const interval = setInterval(loadRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    // Save to localStorage (instant, no server call)
    saveUserSettings({ language: lang }, walletId || undefined);
    console.log('[Language] Language saved:', lang);
  };

  const setCurrency = (curr: string) => {
    setCurrencyState(curr);
    // Save to localStorage (instant, no server call)
    saveUserSettings({ currency: curr }, walletId || undefined);
    console.log('[Language] Currency saved:', curr);
  };

  const convertPrice = (amount: number, fromCurrency: string = 'USD'): number => {
    if (fromCurrency === currency) return amount;

    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[currency] || 1;

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  };

  const formatPrice = (amount: number, symbol?: string): string => {
    const convertedAmount = convertPrice(amount);

    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      KRW: '₩',
      AUD: 'A$',
      CAD: 'C$',
      CHF: 'Fr',
      INR: '₹',
      BRL: 'R$',
      RUB: '₽',
    };

    const currencySymbol = symbol || currencySymbols[currency] || '$';

    // Format number based on currency and value
    let formattedNumber: string;

    if (['JPY', 'KRW'].includes(currency)) {
      // No decimals for JPY and KRW
      formattedNumber = Math.round(convertedAmount).toLocaleString();
    } else if (convertedAmount === 0) {
      // Zero value
      formattedNumber = '0.00';
    } else if (convertedAmount < 0.0001) {
      // Very small values (like meme coins) - show scientific notation or more decimals
      formattedNumber = convertedAmount.toFixed(8).replace(/\.?0+$/, '');
      if (!formattedNumber.includes('.')) formattedNumber += '.00';
    } else if (convertedAmount < 0.01) {
      // Small values - show up to 6 decimal places
      formattedNumber = convertedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });
    } else if (convertedAmount < 1) {
      // Values under $1 - show up to 4 decimal places
      formattedNumber = convertedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      });
    } else {
      // Normal values - round to 2 decimal places like Phantom
      formattedNumber = convertedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    return `${currencySymbol}${formattedNumber}`;
  };

  const t = translations[language] || translations.en;
  const isRTL = RTL_LANGUAGES.includes(language);

  const value: LanguageContextType = {
    language,
    currency,
    t,
    setLanguage,
    setCurrency,
    formatPrice,
    convertPrice,
    isRTL,
    loading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
