import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Translations } from './translations';
import { projectId, publicAnonKey } from '../supabase/info';

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

  // Load user settings from backend
  useEffect(() => {
    if (!walletId) {
      setLoading(false);
      return;
    }

    const loadSettings = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/user-settings/${walletId}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setLanguageState(data.language || 'en');
          setCurrencyState(data.currency || 'USD');
        }
      } catch (error) {
        console.error('Error loading language settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [walletId]);

  // Load exchange rates
  useEffect(() => {
    const loadRates = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/exchange-rates`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            signal: controller.signal,
          }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.rates) {
            setRates(data.rates);
            console.log('[Language] ✅ Exchange rates loaded', data.fallback ? '(fallback)' : '');
          }
        } else {
          console.warn('[Language] ⚠️ Exchange rates fetch failed, using default USD');
          // Keep default USD rate
        }
      } catch (error: any) {
        // Silent fail - just log to console, don't show error to user
        if (error.name === 'AbortError') {
          console.warn('[Language] ⚠️ Exchange rates request timeout');
        } else {
          console.warn('[Language] ⚠️ Exchange rates unavailable:', error.message);
        }
        // App will continue with USD as default currency
      }
    };

    loadRates();
    // Reload rates every hour
    const interval = setInterval(loadRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    
    if (walletId) {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/update-settings`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ 
              walletId, 
              settings: { language: lang, currency } 
            }),
          }
        );
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  };

  const setCurrency = async (curr: string) => {
    setCurrencyState(curr);
    
    if (walletId) {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/update-settings`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ 
              walletId, 
              settings: { language, currency: curr } 
            }),
          }
        );
      } catch (error) {
        console.error('Error saving currency:', error);
      }
    }
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
    
    // Format number based on currency
    let formattedNumber: string;
    
    if (['JPY', 'KRW'].includes(currency)) {
      // No decimals for JPY and KRW
      formattedNumber = Math.round(convertedAmount).toLocaleString();
    } else if (convertedAmount < 0.01 && convertedAmount > 0) {
      // For very small amounts, show more decimals
      formattedNumber = convertedAmount.toFixed(6);
    } else if (convertedAmount < 1) {
      formattedNumber = convertedAmount.toFixed(4);
    } else {
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
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        {children}
      </div>
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
