/**
 * User Settings - Client-side localStorage storage
 *
 * Stores all user preferences locally (Phantom-like architecture)
 * No server calls needed for settings.
 */

export interface UserSettings {
  language: string;
  currency: string;
  theme: string;
  biometricEnabled: boolean;
  requireBiometricForTransactions: boolean; // Ask for biometric before send/swap
  hideBalance: boolean;
  notifications: boolean;
  autoLockMinutes: number;
  slippage: number; // Default swap slippage %
}

const STORAGE_KEY = 'suprik_user_settings';
const EXCHANGE_RATES_KEY = 'suprik_exchange_rates';

// Default settings
const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  currency: 'USD',
  theme: 'cosmic',
  biometricEnabled: false,
  requireBiometricForTransactions: false, // Default to NOT requiring biometric for transactions
  hideBalance: false,
  notifications: true,
  autoLockMinutes: 5,
  slippage: 1, // 1% default slippage
};

// Fallback exchange rates (updated periodically)
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  CNY: 7.24,
  INR: 83.12,
  KRW: 1298,
  SGD: 1.34,
  HKD: 7.82,
  SEK: 10.42,
  NOK: 10.68,
  DKK: 6.87,
  NZD: 1.63,
  ZAR: 18.65,
  BRL: 4.97,
  MXN: 17.15,
  TRY: 28.95,
  RUB: 89.5,
  AED: 3.67,
  SAR: 3.75,
  THB: 35.2,
  MYR: 4.72,
  IDR: 15650,
  PHP: 55.8,
  VND: 24350,
  PLN: 3.98,
  CZK: 22.65,
  HUF: 355,
  ILS: 3.68,
  IRR: 42000, // Iranian Rial
};

/**
 * Get user settings from localStorage
 */
export function getUserSettings(walletId?: string): UserSettings {
  try {
    const key = walletId ? `${STORAGE_KEY}_${walletId}` : STORAGE_KEY;
    const stored = localStorage.getItem(key);
    if (!stored) return { ...DEFAULT_SETTINGS };

    const parsed = JSON.parse(stored);
    // Merge with defaults to ensure all fields exist
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.error('[UserSettings] Error reading settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save user settings to localStorage
 */
export function saveUserSettings(settings: Partial<UserSettings>, walletId?: string): boolean {
  try {
    const key = walletId ? `${STORAGE_KEY}_${walletId}` : STORAGE_KEY;
    const current = getUserSettings(walletId);
    const updated = { ...current, ...settings };
    localStorage.setItem(key, JSON.stringify(updated));
    console.log('[UserSettings] ✅ Settings saved:', Object.keys(settings));
    return true;
  } catch (error) {
    console.error('[UserSettings] Error saving settings:', error);
    return false;
  }
}

/**
 * Update a single setting
 */
export function updateSetting<K extends keyof UserSettings>(
  key: K,
  value: UserSettings[K],
  walletId?: string
): boolean {
  return saveUserSettings({ [key]: value } as Partial<UserSettings>, walletId);
}

/**
 * Get exchange rates (cached or fallback)
 */
export function getExchangeRates(): Record<string, number> {
  try {
    const cached = localStorage.getItem(EXCHANGE_RATES_KEY);
    if (cached) {
      const { rates, timestamp } = JSON.parse(cached);
      // Cache for 1 hour
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        return rates;
      }
    }
  } catch (error) {
    console.error('[UserSettings] Error reading cached rates:', error);
  }
  return { ...FALLBACK_RATES };
}

/**
 * Fetch and cache exchange rates from free API
 */
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    // Try exchangerate.host (free, no API key needed)
    const response = await fetch(
      'https://api.exchangerate.host/latest?base=USD',
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.rates) {
        // Cache the rates
        localStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify({
          rates: data.rates,
          timestamp: Date.now(),
        }));
        console.log('[UserSettings] ✅ Exchange rates fetched and cached');
        return data.rates;
      }
    }
  } catch (error) {
    console.warn('[UserSettings] Exchange rates fetch failed, using fallback');
  }

  // Try alternative free API
  try {
    const response = await fetch(
      'https://open.er-api.com/v6/latest/USD',
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.rates) {
        localStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify({
          rates: data.rates,
          timestamp: Date.now(),
        }));
        console.log('[UserSettings] ✅ Exchange rates fetched from backup API');
        return data.rates;
      }
    }
  } catch (error) {
    console.warn('[UserSettings] Backup exchange API also failed');
  }

  return { ...FALLBACK_RATES };
}

/**
 * Convert amount between currencies
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;

  const exchangeRates = rates || getExchangeRates();
  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;

  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(
  amount: number,
  currency: string = 'USD',
  rates?: Record<string, number>
): string {
  const exchangeRates = rates || getExchangeRates();
  const rate = exchangeRates[currency] || 1;
  const convertedAmount = amount * rate;

  // Currency symbols
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    KRW: '₩',
    INR: '₹',
    RUB: '₽',
    BRL: 'R$',
    TRY: '₺',
    THB: '฿',
    ILS: '₪',
    IRR: '﷼',
    AED: 'د.إ',
    SAR: '﷼',
  };

  const symbol = symbols[currency] || currency + ' ';

  // Format based on currency
  if (['JPY', 'KRW', 'VND', 'IDR', 'IRR'].includes(currency)) {
    // No decimal places for these currencies
    return `${symbol}${Math.round(convertedAmount).toLocaleString()}`;
  }

  return `${symbol}${convertedAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Clear all settings (for logout/reset)
 */
export function clearUserSettings(walletId?: string): void {
  try {
    if (walletId) {
      localStorage.removeItem(`${STORAGE_KEY}_${walletId}`);
    } else {
      // Clear all settings keys
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_KEY));
      keys.forEach(k => localStorage.removeItem(k));
    }
    console.log('[UserSettings] Settings cleared');
  } catch (error) {
    console.error('[UserSettings] Error clearing settings:', error);
  }
}
