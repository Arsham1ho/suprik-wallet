# Parabolic AI (PAI) Token Added ✅

## Overview
کوین **Parabolic AI** با symbol **PAI** به کیف پول Saturn اضافه شد.

## Details
- **Name**: Parabolic
- **Symbol**: PAI
- **Network**: Solana
- **CoinGecko ID**: `parabolic-ai`
- **Logo**: 🤖
- **Link**: https://www.coingecko.com/en/coins/parabolic-ai

## Features

### 1. Real-time Price Updates
قیمت Parabolic AI به صورت real-time از CoinGecko API دریافت می‌شود و هر 30 ثانیه یکبار بروزرسانی می‌شود.

### 2. Dev Mode Support
می‌توانید در Dev Mode به راحتی PAI دریافت کنید:
1. Settings → Developer Options → Enable Dev Mode
2. Home → Dev Mode icon → Select PAI
3. Enter amount → Simulate Receive

### 3. Swap Support
می‌توانید PAI را با سایر توکن‌ها swap کنید (در صفحه Swap).

### 4. Search & Add
می‌توانید PAI را از صفحه Search جستجو کرده و به کیف پول اضافه کنید.

### 5. Coin Details
می‌توانید جزئیات کامل کوین شامل قیمت، نمودار، market cap و ... را مشاهده کنید.

## Implementation

### Server Changes (`/supabase/functions/server/index.tsx`)

#### 1. Token Prices Endpoint
```typescript
// Real-time price from CoinGecko
'parabolic-ai': parabolicAIPrice || {
  price: 0.052,
  change24h: 12.3,
  image: 'https://coin-images.coingecko.com/coins/images/53632/large/IMG_6530.png',
}
```

#### 2. Coin Details Database
```typescript
'parabolic-ai': {
  mint: 'parabolic-ai',
  symbol: 'PAI',
  name: 'Parabolic',
  network: 'solana',
  currentPrice: 0.052,
  // ... more details
}
```

#### 3. Dev Mode Support
```typescript
PAI: { 
  name: 'Parabolic', 
  symbol: 'PAI', 
  mint: 'parabolic-ai',
  network: 'solana',
  price: 0.052, 
  logo: '🤖',
  // ...
}
```

### Frontend Changes

#### DevModeDialog (`/components/DevModeDialog.tsx`)
```typescript
{ 
  symbol: 'PAI', 
  name: 'Parabolic AI', 
  chain: 'solana', 
  logo: '🤖', 
  mint: 'parabolic-ai' 
}
```

## Usage

### For Users
1. **View**: توکن به صورت خودکار در لیست CoinGecko قابل جستجو است
2. **Add**: از صفحه Search می‌توانید PAI را به کیف پول اضافه کنید
3. **Trade**: می‌توانید swap و send انجام دهید
4. **Test**: در Dev Mode می‌توانید PAI تست دریافت کنید

### For Developers
- CoinGecko API ID: `parabolic-ai`
- Network: Solana (devnet/mainnet)
- Logo emoji: 🤖
- Fallback price: $0.052

## Notes
- ✅ Real-time price updates از CoinGecko
- ✅ Fallback price در صورت عدم دسترسی به API
- ✅ Support کامل در Swap, Send, Activity
- ✅ Dev Mode برای تست
- ✅ Logo از CoinGecko دریافت می‌شود

## Status
🟢 **Active** - Parabolic AI به طور کامل فعال و آماده استفاده است.
