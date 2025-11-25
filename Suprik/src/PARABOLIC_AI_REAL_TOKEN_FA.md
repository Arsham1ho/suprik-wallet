# 🎯 راهنمای کامل توکن Parabolic AI - نسخه واقعی

## ⚠️ اطلاعات مهم

### توکن Parabolic AI واقعی
توکن Parabolic AI یک توکن واقعی روی **Solana blockchain** است.

**اطلاعات توکن:**
- **نام**: Parabolic
- **نماد (Symbol)**: PAI یا PARAI
- **شبکه**: Solana (Mainnet)
- **CoinGecko ID**: `parabolic-ai`
- **آدرس Mint (Contract)**: `Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh`
- **Decimals**: 9 (استاندارد Solana)
- **لینک CoinGecko**: https://www.coingecko.com/en/coins/parabolic-ai
- **لینک Solscan**: https://solscan.io/token/Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh

---

## 🔍 چگونه کار می‌کند؟

### 1️⃣ دریافت توکن (Receive)
وقتی کسی برای شما توکن Parabolic AI ارسال می‌کند:

```javascript
// کیف پول Saturn دقیقاً مثل Phantom:
1. هر 10 ثانیه blockchain Solana رو اسکن می‌کنه
2. از Helius API استفاده می‌کنه برای گرفتن همه SPL tokens
3. تمام توکن‌های روی آدرس شما رو پیدا می‌کنه (شامل PARAI)
4. اطلاعات توکن (نام، symbol، لوگو) رو از metadata می‌گیره
5. قیمت رو از CoinGecko API دریافت می‌کنه
6. به صورت خودکار در کیف پول نمایش داده می‌شه
```

### 2️⃣ نمایش موجودی (Balance Display)
```javascript
// کد واقعی از backend:
const tokensResponse = await fetch(heliusUrl, {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'getTokenAccountsByOwner',
    params: [
      walletAddress,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' } // SPL Token Program
    ]
  })
});

// همه SPL tokens رو میاره (شامل PARAI)
```

### 3️⃣ قیمت لحظه‌ای (Real-time Price)
```javascript
// از CoinGecko API:
const priceResponse = await fetch(
  'https://api.coingecko.com/api/v3/simple/price?ids=parabolic-ai&vs_currencies=usd'
);

// قیمت واقعی PARAI از بازار
```

---

## ✅ تست کردن

### روش 1: دریافت واقعی از Solana Mainnet

اگر می‌خواهید توکن واقعی دریافت کنید:

1. **Testnet Mode رو خاموش کنید**
   ```
   Settings → Developer → Testnet Mode: OFF
   ```

2. **آدرس Solana خود را کپی کنید**
   ```
   Home → Receive → کپی آدرس
   ```

3. **از یک کیف پول دیگر (مثل Phantom) PARAI ارسال کنید**
   ```
   از آدرس: کیف پول Phantom شما
   به آدرس: کیف پول Saturn شما
   مقدار: هر مقداری که می‌خواهید
   توکن: Parabolic AI (PARAI)
   ```

4. **منتظر تأیید باشید (معمولاً 30-60 ثانیه)**
   ```
   Solana Mainnet معمولاً خیلی سریع تأیید می‌کنه
   ```

5. **چک کنید در والت**
   ```
   Home → صبر کنید 10 ثانیه (auto-refresh)
   یا
   دکمه Refresh (🔄) رو بزنید
   ```

### روش 2: بررسی با Balance Checker

برای مطمئن شدن که توکن روی blockchain هست:

```
Settings → Developer → Balance Checker → Check All Balances
```

این ابزار دقیقاً نشون میده چی روی blockchain شما هست.

---

## 🔧 تنظیمات لازم

### 1. API Keys
برای کار کردن دریافت توکن، باید API key ها رو تنظیم کنید:

**Helius API (برای Solana):**
```
Settings → Developer → API Keys → Helius API Key
```

کجا بگیرید؟
- https://helius.dev
- Sign up رایگان
- کپی کنید API key
- Paste کنید در Saturn

**Alchemy API (برای Ethereum - اختیاری):**
```
Settings → Developer → API Keys → Alchemy API Key
```

### 2. Network Mode
```
Settings → Developer → Testnet Mode
```

- **OFF** = Mainnet (توکن‌های واقعی، پول واقعی) ✅
- **ON** = Testnet (توکن‌های تستی، بدون ارزش)

---

## 📊 مثال واقعی

### سناریو: دریافت 100 PARAI

1. **شما آدرس Solana دارید:**
   ```
   7xK8...9sPq (مثال)
   ```

2. **دوستتان از Phantom برای شما 100 PARAI می‌فرسته:**
   ```
   Transaction: https://solscan.io/tx/ABC123...
   از: آدرس دوستتان
   به: 7xK8...9sPq
   مقدار: 100 PARAI
   ```

3. **بعد از 30 ثانیه، Saturn خودکار detect می‌کنه:**
   ```
   [Solana] ✅ MAINNET Balance: 0.5 SOL
   [Solana] Found 2 token accounts on MAINNET
   [Solana] Token: Parabolic AI (PARAI)
   [Solana] Amount: 100
   [Solana] Mint: Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh
   ```

4. **توکن در Home screen نمایش داده می‌شه:**
   ```
   📊 Your Tokens
   ┌──────────────────────────────┐
   │ Parabolic AI (PARAI)         │
   │ 100 tokens                   │
   │ $5.20 (با فرض قیمت $0.052)  │
   └──────────────────────────────┘
   ```

---

## 🎨 جزئیات فنی

### Mint Address
```
Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh
```

این آدرس contract واقعی PARAI روی Solana است.

### Token Program
```
TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

SPL Token Program استاندارد Solana.

### RPC Endpoint (Helius)
```
Mainnet: https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
Devnet:  https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

### API Calls

**گرفتن balance:**
```javascript
POST https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
{
  "jsonrpc": "2.0",
  "method": "getTokenAccountsByOwner",
  "params": [
    "YOUR_WALLET_ADDRESS",
    { "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { "encoding": "jsonParsed" }
  ]
}
```

**گرفتن metadata توکن:**
```javascript
POST https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
{
  "jsonrpc": "2.0",
  "method": "getAsset",
  "params": {
    "id": "Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh"
  }
}
```

**گرفتن قیمت:**
```javascript
GET https://api.coingecko.com/api/v3/simple/price?ids=parabolic-ai&vs_currencies=usd

Response:
{
  "parabolic-ai": {
    "usd": 0.052
  }
}
```

---

## 🐛 عیب‌یابی (Debugging)

### مشکل 1: توکن نمایش داده نمی‌شه

**چک کنید:**
1. ✅ Testnet Mode خاموش است (برای mainnet tokens)
2. ✅ Helius API Key تنظیم شده
3. ✅ Transaction تأیید شده روی blockchain
4. ✅ صبر کردید 30-60 ثانیه

**Console logs مفید:**
```javascript
[Solana] 🔗 Fetching balance from MAINNET
[Solana] ✅ MAINNET Balance: 0.5 SOL
[Solana] Found 2 token accounts on MAINNET
[Solana] 🎯 Parabolic AI token search result: { ... }
```

### مشکل 2: Balance صفر نشون میده

**دلایل احتمالی:**
1. توکن هنوز ارسال نشده
2. Transaction هنوز confirm نشده
3. آدرس اشتباه

**چک کنید با Solscan:**
```
https://solscan.io/account/YOUR_WALLET_ADDRESS
```

### مشکل 3: قیمت صفر نشون میده

**دلایل:**
1. CoinGecko API limit شده (rate limit)
2. توکن در CoinGecko ثبت نشده
3. Network error

**راه حل:**
```
صبر کنید 2-3 دقیقه
Refresh کنید
قیمت از cache بارگذاری می‌شه
```

---

## 📱 تجربه کاربر (UX)

### مثل Phantom:

✅ **Auto-detect tokens**
- همه SPL tokens خودکار detect می‌شن
- نیازی به add کردن دستی نیست

✅ **Auto-refresh every 10 seconds**
- Balance به صورت خودکار بروز می‌شه
- مثل Phantom دقیقاً

✅ **Real-time prices**
- قیمت‌ها از CoinGecko
- Cache می‌شن برای سرعت

✅ **Transaction history**
- در صفحه Activity
- همه transactions رو نشون میده

---

## 🔐 امنیت

### Client-Side Wallet
کیف پول Saturn دقیقاً مثل Phantom کار می‌کنه:

```
✅ Private keys هیچوقت به سرور ارسال نمی‌شن
✅ همه چیز client-side است
✅ فقط public addresses به blockchain API ها فرستاده می‌شه
✅ Transaction signing فقط در browser شما
```

### API Keys
```
✅ Helius API Key فقط برای query کردن blockchain
✅ نمی‌تونه پول بفرسته یا بگیره
✅ فقط read-only access
```

---

## 📚 مراجع

### لینک‌های مفید:

**Parabolic AI:**
- CoinGecko: https://www.coingecko.com/en/coins/parabolic-ai
- Solscan: https://solscan.io/token/Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh

**Solana:**
- Solscan Explorer: https://solscan.io
- Solana Explorer: https://explorer.solana.com

**APIs:**
- Helius: https://helius.dev
- CoinGecko: https://www.coingecko.com/en/api

---

## ✨ خلاصه

کیف پول Saturn دقیقاً مثل Phantom عمل می‌کنه:

```
1. ✅ توکن‌های واقعی Solana
2. ✅ دریافت خودکار SPL tokens (شامل PARAI)
3. ✅ قیمت لحظه‌ای از CoinGecko
4. ✅ Auto-refresh هر 10 ثانیه
5. ✅ امن و client-side
6. ✅ Transaction history واقعی
7. ✅ ارسال واقعی توکن‌ها
```

**همه چیز واقعی است - بدون mock data!** 🎉

---

## 🎯 آدرس Mint برای توسعه‌دهندگان

اگر می‌خواهید کد بنویسید:

```typescript
const PARABOLIC_AI_TOKEN = {
  mint: 'Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh',
  symbol: 'PARAI',
  name: 'Parabolic',
  decimals: 9,
  network: 'solana',
  coingeckoId: 'parabolic-ai'
};
```

این اطلاعات برای:
- Swap functionality (Jupiter)
- Send tokens
- Balance checking
- Price tracking

استفاده می‌شه.
