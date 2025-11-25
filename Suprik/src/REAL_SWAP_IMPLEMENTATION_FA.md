# 🔄 پیاده‌سازی Real Swap در Saturn - مانند Phantom

## خلاصه

Saturn حالا از **Real Jupiter Swaps** پشتیبانی می‌کند - دقیقاً مانند Phantom! تمام محدودیت‌های CORS و iframe از طریق یک backend proxy حل شده‌اند.

## 🎯 چگونه کار می‌کند

### معماری

```
Frontend (React)
    ↓
Backend Proxy (Supabase Edge Function)
    ↓
Jupiter API v6
    ↓
Solana Blockchain (Mainnet/Devnet)
```

### جریان Swap

1. **کاربر مقدار swap را وارد می‌کند**
   - Frontend مبلغ، token ورودی و خروجی را می‌گیرد

2. **دریافت Quote از Jupiter**
   - ابتدا از backend proxy تلاش می‌کند: `/jupiter/quote`
   - در صورت عدم موفقیت، تلاش مستقیم از Jupiter API
   - در صورت عدم موفقیت هر دو، fallback به mock quote

3. **اجرای Swap**
   - ابتدا از backend proxy تلاش می‌کند: `/jupiter/swap`
   - در صورت عدم موفقیت، تلاش مستقیم از Jupiter API
   - Transaction signing در client-side (امنیت کامل)
   - ارسال transaction به Solana blockchain
   - انتظار برای confirmation

4. **نمایش نتیجه**
   - نمایش signature transaction واقعی
   - به‌روزرسانی موجودی wallet
   - ذخیره در transaction history

## 📁 فایل‌های کلیدی

### Backend: `/supabase/functions/server/index.tsx`

```typescript
// Jupiter Quote Proxy
app.get("/make-server-e5bc10d1/jupiter/quote", async (c) => {
  // دریافت quote از Jupiter API و bypass کردن CORS
});

// Jupiter Swap Proxy
app.post("/make-server-e5bc10d1/jupiter/swap", async (c) => {
  // دریافت swap transaction از Jupiter API
});
```

### Frontend: `/utils/jupiterSwap.ts`

```typescript
// روش 1: استفاده از Backend Proxy (اولویت اول)
const proxyUrl = `https://${projectId}.supabase.co/.../jupiter/quote`;
const response = await fetch(proxyUrl, { ... });

// روش 2: فراخوانی مستقیم Jupiter API (fallback)
const directUrl = `https://quote-api.jup.ag/v6/quote`;
const response = await fetch(directUrl, { ... });

// روش 3: Mock Quote (fallback نهایی)
return generateMockQuote();
```

## 🔐 امنیت

- ✅ **Private keys هرگز به backend ارسال نمی‌شوند**
- ✅ **Transaction signing فقط در client-side**
- ✅ **Backend فقط به عنوان proxy عمل می‌کند**
- ✅ **هیچ داده حساسی ذخیره نمی‌شود**

## 🚀 مزایا

### 1. دور زدن محدودیت‌های Iframe
- ✅ Jupiter API از iframe فیگما قابل دسترسی است
- ✅ هیچ خطای CORS وجود ندارد
- ✅ Fallback هوشمند در صورت بروز مشکل

### 2. تجربه کاربری مانند Phantom
- ✅ Swap‌های واقعی با قیمت‌های real-time
- ✅ Route optimization توسط Jupiter
- ✅ Price impact و slippage واقعی
- ✅ Transaction signatures واقعی

### 3. قابلیت اطمینان
- ✅ سه لایه fallback (Proxy → Direct → Mock)
- ✅ Timeout handling برای تمام requests
- ✅ خطاهای مفصل برای debugging

## 📊 حالت‌های عملکرد

### 1. Mainnet Mode (واقعی)
```typescript
network.isTestnet = false
```
- استفاده از Jupiter API واقعی
- Swap‌های واقعی در Solana mainnet
- هزینه‌های واقعی و price impact
- Balance واقعی به‌روز می‌شود

### 2. Testnet Mode (شبیه‌سازی)
```typescript
network.isTestnet = true
```
- استفاده از mock quotes
- شبیه‌سازی swap بدون هزینه
- برای تست و توسعه

### 3. Demo Mode (خودکار)
- زمانی که Jupiter API غیرقابل دسترس باشد
- Fallback خودکار به mock quotes
- banner اطلاع‌رسانی به کاربر

## 🔧 تنظیمات

### Slippage Tolerance
```typescript
slippage: 0.5 // 0.5% (پیش‌فرض)
```

### Timeouts
```typescript
Quote timeout: 10 seconds (proxy), 5 seconds (direct)
Swap timeout: 15 seconds
```

### Token Support
```typescript
TOKEN_MINTS = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  // ... و سایر توکن‌ها
}
```

## 🐛 Debugging

### مشاهده Logs

در Console مرورگر:
```
[Jupiter] Getting swap quote...
[Jupiter] Attempting to fetch quote through backend proxy...
[Jupiter] ✅ Quote received via proxy!
[Jupiter] 🚀 Executing swap...
[Jupiter] ✅ Swap transaction received via proxy
[Jupiter] ✅ Swap confirmed!
```

### خطاهای رایج

#### 1. "No quote available"
- بررسی کنید که token هر دو در Jupiter پشتیبانی می‌شوند
- مطمئن شوید که مبلغ بیشتر از 0 است

#### 2. "Insufficient balance"
- موجودی کافی + هزینه transaction داشته باشید
- در Solana حداقل 0.01 SOL برای rent نیاز است

#### 3. "Jupiter API unavailable"
- اتصال اینترنت خود را بررسی کنید
- به Testnet mode بروید برای شبیه‌سازی

## 📝 مثال استفاده

### در کد Frontend:

```typescript
import { getJupiterSwapQuote, executeJupiterSwap } from './utils/jupiterSwap';

// 1. دریافت Quote
const quote = await getJupiterSwapQuote({
  inputMint: 'So11111111111111111111111111111111111111112', // SOL
  outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amount: 1.0, // 1 SOL
  slippage: 0.5, // 0.5%
  isTestnet: false, // Mainnet
  inputDecimals: 9,
  outputDecimals: 6,
});

console.log('Output:', quote.outputAmount); // مثلاً 100 USDC

// 2. اجرای Swap
const result = await executeJupiterSwap({
  mnemonic: wallet.mnemonic,
  quoteResponse: quote,
  isTestnet: false,
});

if (result.success) {
  console.log('Swap successful!');
  console.log('Signature:', result.signature);
} else {
  console.error('Swap failed:', result.error);
}
```

## 🎉 نتیجه

Saturn حالا یک **کیف پول کامل با قابلیت swap واقعی** است، دقیقاً مانند Phantom! کاربران می‌توانند:

- ✅ Swap‌های واقعی را با قیمت‌های real-time انجام دهند
- ✅ از بهترین routes Jupiter استفاده کنند
- ✅ Transaction signatures واقعی دریافت کنند
- ✅ در Solana blockchain تراکنش‌های واقعی داشته باشند

---

**نکته مهم:** همه این قابلیت‌ها بدون نیاز به هیچگونه تغییر از سمت کاربر فعال هستند. فقط کافی است از Mainnet mode استفاده کنید!
