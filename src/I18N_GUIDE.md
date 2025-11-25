# Internationalization (i18n) Guide

## Overview

Saturn Wallet now supports multiple languages and currencies with automatic conversion and real-time updates.

## Features

### 🌍 Multi-Language Support
- **12 Languages**: English, فارسی (Persian), Español, Français, Deutsch, 中文, 日本語, 한국어, العربية, Português, Русский, Türkçe
- **RTL Support**: Automatic right-to-left layout for Arabic and Persian
- **User Preferences**: Each user can select their preferred language

### 💱 Multi-Currency Support
- **12 Currencies**: USD, EUR, GBP, JPY, CNY, KRW, AUD, CAD, CHF, INR, BRL, RUB
- **Real-Time Conversion**: All prices automatically convert to user's selected currency
- **Exchange Rates**: Fetched from API and cached for 1 hour
- **Smart Formatting**: Different decimal places for different currencies (e.g., JPY/KRW have no decimals)

## Usage in Components

### 1. Import the Hook
```tsx
import { useLanguage } from '../utils/i18n/LanguageContext';
```

### 2. Use in Component
```tsx
function MyComponent() {
  const { t, formatPrice, language, currency, isRTL } = useLanguage();
  
  return (
    <div>
      {/* Use translations */}
      <h1>{t.home.totalBalance}</h1>
      
      {/* Format prices */}
      <p>{formatPrice(123.45)}</p> {/* Automatically converts to user's currency */}
    </div>
  );
}
```

## Translation Structure

All translations are defined in `/utils/i18n/translations.ts`:

```tsx
{
  landing: { ... },
  auth: { ... },
  nav: { ... },
  home: { ... },
  sendReceive: { ... },
  swap: { ... },
  activity: { ... },
  settings: { ... },
  common: { ... },
  messages: { ... }
}
```

## Adding New Languages

1. Open `/utils/i18n/translations.ts`
2. Add language to `PreferencesSettings.tsx` languages array
3. Add translation object to `translations` object:

```tsx
export const translations: Record<string, Translations> = {
  en: { ... },
  fa: { ... },
  // Add new language
  es: {
    landing: {
      title: 'Billetera Saturn',
      // ... etc
    }
  }
};
```

4. If RTL language, add to RTL_LANGUAGES array in `LanguageContext.tsx`

## Backend API

### Exchange Rates Endpoint
- **URL**: `/make-server-e5bc10d1/exchange-rates`
- **Method**: GET
- **Caching**: 1 hour
- **Fallback**: Default rates if API fails
- **API**: Uses exchangerate-api.com (free tier)

### User Settings Endpoints
- **Get Settings**: `GET /make-server-e5bc10d1/user-settings/:walletId`
- **Update Settings**: `POST /make-server-e5bc10d1/update-settings`

## Price Formatting

The `formatPrice()` function:
- Converts USD prices to user's currency
- Handles very small amounts (crypto)
- Uses appropriate decimal places
- Adds currency symbol

```tsx
formatPrice(100)        // "$100.00" or "€92.00" or "¥14,950" depending on user settings
formatPrice(0.0001)     // "$0.0001" (shows more decimals for small amounts)
formatPrice(1000000)    // "$1,000,000.00" (adds thousand separators)
```

## Components Updated

The following components now use i18n:
- ✅ MainApp (wraps with LanguageProvider)
- ✅ BottomNav (nav labels)
- ✅ Home (balance, buttons, asset list)
- ✅ PreferencesSettings (all UI text)

## TODO: Components to Update

These components still need i18n integration:
- [ ] Landing page
- [ ] SignIn / SignUp
- [ ] Send page
- [ ] Swap page
- [ ] Activity page
- [ ] Settings pages (Account, Security, etc.)
- [ ] Dialogs (Send, Receive, AddToken)

## Testing

1. Go to Settings → Preferences
2. Change Display Language (e.g., to فارسی)
3. Change Primary Currency (e.g., to EUR)
4. Navigate to Home
5. Verify:
   - All text is in Persian
   - Layout is RTL
   - Prices show € symbol
   - Values are converted to EUR

## Notes

- Language/Currency changes are immediate (no page reload needed)
- Settings are saved to backend and persist across sessions
- Exchange rates update hourly
- Fallback to English/USD if settings fail to load
