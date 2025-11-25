# 🔧 Token Data Fix - حذف توکن‌های Fake

## ✅ تغییرات انجام شده

### مشکل:
توکن‌های fake/تستی در کد قرار داشتند که اطلاعات نادرست داشتند:
- ❌ Parabolic AI (PAI)
- ❌ Shajarian (OSTAD)  
- ❌ Parabolic (PARAX)

این توکن‌ها در CoinGecko وجود ندارند و داده‌های fake بودند.

---

## ✅ راه حل: حذف کامل توکن‌های Fake

### تغییرات در `/supabase/functions/server/index.tsx`:

#### 1️⃣ حذف از fallback database (خط 325-369):
```typescript
// قبل:
const coinDatabase: any = {
  'parabolic': { ... },
  'shajarian': { ... },
  'parabolic-ai': { ... },
  'solana': { ... },
  ...
}

// بعد:
const coinDatabase: any = {
  'solana': { ... },  // فقط توکن‌های واقعی
  'ethereum': { ... },
  'bitcoin': { ... },
  ...
}
```

#### 2️⃣ حذف از tokenMetadata (خط 854-862):
```typescript
// قبل:
PAI: { 
  name: 'Parabolic AI', 
  symbol: 'PAI', 
  ...
},

// بعد:
// حذف شد
```

#### 3️⃣ حذف از CoinGecko API call (خط 1161-1267):
```typescript
// قبل:
const customCoinIds = ['parabolic', 'shajarian', 'parabolic-ai'];
// + 100 خط کد برای fetch و fallback

// بعد:
// No custom/fake coins - all data comes from real CoinGecko API
let customCoins = [];
```

### تغییرات در `/components/pages/Home.tsx`:

#### حذف از DEFAULT_TOKENS (خط 95-104):
```typescript
// قبل:
{
  mint: 'parabolic-ai',
  name: 'Parabolic AI',
  symbol: 'PAI',
  ...
},

// بعد:
// حذف شد
```

---

## 📊 توکن‌های معتبر باقی‌مانده

✅ **Solana (SOL)** - Real  
✅ **Ethereum (ETH)** - Real  
✅ **Bitcoin (BTC)** - Real  
✅ **USD Coin (USDC)** - Real  
✅ **Bonk (BONK)** - Real (Solana meme coin)  
✅ **Polygon (MATIC)** - Real  

**+ 10,000+ توکن دیگر از CoinGecko API**

---

## 🎯 نتیجه

### قبل از Fix:
```
❌ Parabolic AI - اطلاعات fake
❌ Shajarian - اطلاعات fake  
❌ Parabolic - اطلاعات fake
✅ SOL, ETH, BTC - درست
```

### بعد از Fix:
```
✅ همه داده‌ها از CoinGecko API واقعی
✅ فقط توکن‌های معتبر و شناخته شده
✅ کاربر می‌تواند هر توکنی از CoinGecko اضافه کند
✅ هیچ داده fake ای در کد نیست
```

---

## 🔍 چطور بررسی کنیم؟

### 1. در صفحه Home:
- فقط SOL، ETH، BTC، USDC نمایش داده می‌شود
- توکن‌های fake دیگر نیستند

### 2. در صفحه Search:
- فقط توکن‌های واقعی از CoinGecko نمایش داده می‌شوند
- می‌توانید Bitcoin، Ethereum، Cardano، و... جستجو کنید

### 3. اگر می‌خواهید توکن خاصی اضافه کنید:
- در CoinGecko جستجو کنید
- اگر وجود داشت، می‌توانید اضافه کنید
- اگر نبود، یعنی توکن معتبر نیست

---

## 📝 توصیه‌ها برای آینده

### اگر می‌خواهید توکن خاصی را به طور پیش‌فرض اضافه کنید:

1. **مطمئن شوید توکن در CoinGecko وجود دارد:**
   ```
   https://www.coingecko.com/en/coins/[coin-name]
   ```

2. **CoinGecko ID را پیدا کنید:**
   مثلاً برای Cardano: `cardano`

3. **توکن را به DEFAULT_TOKENS اضافه کنید:**
   ```typescript
   {
     mint: 'cardano',
     name: 'Cardano',
     symbol: 'ADA',
     amount: 0,
     logo: '₳',
     logoUrl: '',
     color: 'from-blue-500 to-blue-700',
     network: 'cardano'
   }
   ```

---

## ⚠️ مهم

**هیچوقت توکن‌های fake یا فرضی در production استفاده نکنید!**

اگر می‌خواهید برای testing استفاده کنید:
1. از Solana Devnet استفاده کنید
2. یا یک flag `isDev` اضافه کنید
3. در production فقط توکن‌های واقعی نشان دهید

---

## ✅ Status

| Item | Status |
|------|--------|
| حذف Parabolic AI | ✅ Done |
| حذف Shajarian | ✅ Done |
| حذف Parabolic | ✅ Done |
| حذف از backend | ✅ Done |
| حذف از frontend | ✅ Done |
| تست | ✅ Ready |

---

**🪐 Saturn Wallet - Only Real Data, No Fakes!**

---

**تاریخ:** نوامبر 2025  
**نسخه:** 1.0.1  
**تغییرات:** حذف توکن‌های fake
