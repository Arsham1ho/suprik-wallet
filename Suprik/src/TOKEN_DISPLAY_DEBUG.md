# 🔍 راهنمای عیب‌یابی نمایش توکن‌ها

## 🎯 مشکل: توکن‌های ارسال شده (مثل PUMP و PAI) نمایش داده نمی‌شوند

### مراحل عیب‌یابی:

## 1️⃣ بررسی Console مرورگر

باز کردن Developer Tools (F12) و بررسی لاگ‌های زیر:

### الف) لاگ‌های دریافت توکن از Blockchain

```
[Blockchain] 🔄 Fetching balances for Solana network only...
[Solana] 🔗 Fetching balance from MAINNET for XXXXXXXX...
[Solana] ✅ MAINNET Balance: X.XXXXXX SOL
[Solana] ✅ Found X SPL tokens
```

**چیزی که باید چک کنید**: تعداد توکن‌های SPL پیدا شده

### ب) لاگ‌های TokenLoader

```
[TokenLoader] 🚀 Loading tokens in mainnet mode...
[TokenLoader] 📊 Blockchain data received:
  - SOL balance: X.XXXX
  - SPL tokens: X
```

**چیزی که باید چک کنید**: آیا تعداد SPL tokens درست است؟

### ج) لاگ‌های دقیق توکن‌ها

```
[TokenLoader] 🎯 Auto-adding X SPL tokens...
[TokenLoader] 📋 SPL tokens from blockchain: [
  {symbol: "USDC", name: "USD Coin", amount: 100, mint: "EPjF..."},
  {symbol: "PUMP", name: "Pump Token", amount: 50, mint: "xyz..."},
  {symbol: "PAI", name: "PAI Token", amount: 25, mint: "abc..."}
]
```

**چیزی که باید چک کنید**: آیا PUMP و PAI در این لیست هستند؟

### د) لاگ‌های اضافه شدن توکن

```
[TokenLoader] ✅ Adding token #1: {symbol: "USDC", name: "USD Coin", amount: 100, mint: "...", logoUrl: "..."}
[TokenLoader] ✅ Adding token #2: {symbol: "PUMP", name: "Pump Token", amount: 50, mint: "...", logoUrl: "..."}
[TokenLoader] ✅ Adding token #3: {symbol: "PAI", name: "PAI Token", amount: 25, mint: "...", logoUrl: "..."}
```

**چیزی که باید چک کنید**: آیا توکن‌های شما به لیست نهایی اضافه می‌شوند؟

---

## 2️⃣ بررسی لاگ‌های سرور

در پنل Supabase Edge Functions، لاگ‌های سرور را چک کنید:

### الف) لاگ‌های اکانت‌های توکن

```
[Solana] Found 5 token accounts on MAINNET
[Solana] Token account #1: mint=EPjFWdd5..., amount=100
[Solana] Token account #2: mint=xyzABC12..., amount=50
[Solana] Token account #3: mint=abcDEF34..., amount=25
```

**چیزی که باید چک کنید**: 
- آیا تعداد token accounts درست است؟
- آیا mint address توکن‌های شما در لیست هست؟
- آیا amount > 0 است؟

### ب) لاگ‌های متادیتا

```
[Solana] ✅ Metadata for EPjFWdd5...: USDC (USD Coin), logo=Yes
[Solana] ✅ Metadata for xyzABC12...: PUMP (Pump Token), logo=Yes
[Solana] ✅ Metadata for abcDEF34...: PAI (PAI Token), logo=No
```

یا اگر خطا داشته باشد:

```
[Solana] ⚠️ No metadata result for xyzABC12...
[Solana] Could not fetch metadata for abcDEF34...: Error message
```

**چیزی که باید چک کنید**:
- آیا متادیتا با موفقیت دریافت می‌شود؟
- آیا symbol و name درست هستند؟

---

## 3️⃣ سناریوهای مختلف مشکل

### 🔴 سناریو 1: توکن در لاگ‌های سرور نیست

**علت**: تراکنش هنوز confirm نشده یا به آدرس اشتباه ارسال شده

**راه‌حل**:
1. در Solana Explorer آدرس خود را چک کنید: `https://explorer.solana.com/address/YOUR_ADDRESS`
2. ببینید آیا توکن در لیست Token Accounts موجود است
3. اگر نیست، تراکنش را چک کنید - شاید به آدرس دیگری ارسال شده

### 🟡 سناریو 2: توکن در لاگ‌های سرور هست اما amount = 0

**علت**: موجودی توکن 0 است (احتمالاً transfer کامل شده)

**راه‌حل**:
1. در Solana Explorer موجودی را چک کنید
2. اگر amount واقعاً > 0 است ولی 0 نمایش می‌دهد، ممکن است مشکل decimals باشد
3. بررسی کنید: `uiAmount` در RPC response چقدر است

### 🟢 سناریو 3: توکن در لاگ‌های سرور هست با amount > 0 اما متادیتا دریافت نمی‌شود

**علت**: Helius DAS API برای این توکن metadata ندارد

**راه‌حل**:
این نباید مانع نمایش توکن شود! توکن باید با این اطلاعات نمایش داده شود:
- Symbol: "TOKEN" (پیش‌فرض)
- Name: "Unknown Token"
- Logo: حرف اول symbol (مثلاً "T")

اگر نمایش داده نمی‌شود، یک bug در کد است که باید fix شود.

### 🔵 سناریو 4: توکن در blockchain data هست اما در TokenLoader فیلتر می‌شود

**علت**: شرط `amount > 0 || !isTestnet` در tokenLoader

**راه‌حل**:
1. چک کنید که در حالت Mainnet هستید (نه Testnet)
2. اگر در Testnet هستید، فقط توکن‌هایی با `amount > 0` نمایش داده می‌شوند

### 🟣 سناریو 5: توکن به لیست tokens اضافه می‌شود اما در UI نمایش داده نمی‌شود

**علت**: مشکل rendering در React

**راه‌حل**:
1. در Console تایپ کنید: `console.log(tokens)`
2. آیا توکن در آرایه tokens موجود است؟
3. اگر هست، مشکل در component rendering است - بررسی کنید که component برای render همه tokens طراحی شده باشد

---

## 4️⃣ تست دستی

### Test با Solana Explorer

1. به آدرس بروید: `https://explorer.solana.com/address/YOUR_SOLANA_ADDRESS`
2. تب "Tokens" را باز کنید
3. لیست تمام Token Accounts را ببینید
4. برای هر توکن، Mint Address و Balance را یادداشت کنید

### Test با Helius RPC مستقیم

در Console مرورگر این کد را اجرا کنید:

```javascript
const address = "YOUR_SOLANA_ADDRESS";
const apiKey = "e7ec6503-c9b2-4c0b-ae5f-3646622d4896";

// دریافت توکن accounts
fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getTokenAccountsByOwner',
    params: [
      address,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding: 'jsonParsed' }
    ]
  })
})
.then(r => r.json())
.then(data => {
  console.log('Token Accounts:', data.result.value.length);
  data.result.value.forEach((acc, i) => {
    const info = acc.account.data.parsed.info;
    console.log(`Token #${i + 1}:`, {
      mint: info.mint,
      amount: info.tokenAmount.uiAmount,
      decimals: info.tokenAmount.decimals
    });
  });
})
```

### Test متادیتا برای یک توکن خاص

```javascript
const mintAddress = "YOUR_TOKEN_MINT_ADDRESS"; // مثلاً PUMP یا PAI
const apiKey = "e7ec6503-c9b2-4c0b-ae5f-3646622d4896";

fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getAsset',
    params: { id: mintAddress }
  })
})
.then(r => r.json())
.then(data => {
  console.log('Token Metadata:', {
    name: data.result?.content?.metadata?.name,
    symbol: data.result?.content?.metadata?.symbol,
    logo: data.result?.content?.links?.image
  });
})
```

---

## 5️⃣ راه‌حل‌های سریع

### Fix 1: Force Refresh

در صفحه Home، دکمه Refresh را بزنید یا:

```javascript
// در Console
window.location.reload();
```

### Fix 2: Clear Cache

```javascript
// پاک کردن cache توکن‌ها
localStorage.removeItem('token_logos_cache');
window.location.reload();
```

### Fix 3: Check Network Mode

در Settings مطمئن شوید که در حالت درست هستید:
- **Mainnet**: تمام توکن‌ها نمایش داده می‌شوند (حتی با 0 balance)
- **Testnet/Devnet**: فقط توکن‌هایی با balance > 0

---

## 6️⃣ چک‌لیست نهایی

قبل از گزارش bug، این موارد را چک کنید:

- [ ] آیا تراکنش ارسال توکن confirmed شده؟
- [ ] آیا به آدرس صحیح Solana ارسال شده؟
- [ ] آیا در Solana Explorer توکن visible است؟
- [ ] آیا در حالت Mainnet هستید؟ (نه Testnet)
- [ ] آیا Refresh را زده‌اید؟
- [ ] آیا لاگ‌های Console را چک کرده‌اید؟
- [ ] آیا لاگ‌های Server را در Supabase چک کرده‌اید؟
- [ ] آیا balance توکن > 0 است؟

---

## 🎯 اطلاعات مفید برای گزارش Bug

اگر بعد از این مراحل هنوز مشکل وجود دارد، این اطلاعات را جمع‌آوری کنید:

1. **آدرس Solana شما**: (8 کاراکتر اول کافیست)
2. **Mint address توکن مشکل‌دار**: 
3. **Symbol و Name توکن**:
4. **لاگ‌های Console**: (screenshot یا copy/paste)
5. **لاگ‌های Server**: (از پنل Supabase)
6. **Network Mode**: Mainnet یا Testnet؟
7. **Explorer Link**: لینک از solana explorer

---

## ✅ تغییرات اعمال شده برای بهبود عیب‌یابی

### 1. لاگ‌های بهتر در TokenLoader
- ✅ لاگ تمام توکن‌های دریافت شده از blockchain
- ✅ لاگ جزئیات هر توکنی که اضافه می‌شود
- ✅ لاگ logoUrl از Helius

### 2. لاگ‌های بهتر در Server
- ✅ لاگ تمام token accounts (حتی با 0 balance)
- ✅ لاگ متادیتا برای هر توکن
- ✅ لاگ واضح‌تر برای errors

### 3. Fix logoUrl
- ✅ اولویت به logoUrl از Helius DAS API
- ✅ Fallback به CoinGecko اگر Helius logo نداشت

---

**آخرین به‌روزرسانی**: 17 نوامبر 2024  
**نسخه**: 1.0  
**وضعیت**: فعال و در حال تست
