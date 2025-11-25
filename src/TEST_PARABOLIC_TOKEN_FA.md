# 🧪 راهنمای تست توکن Parabolic AI

## ✅ آماده شد!

کیف پول Saturn اکنون با آدرس mint واقعی Parabolic AI کار می‌کنه:

```
Mint Address: Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh
CoinGecko ID: parabolic-ai
Symbol: PARAI یا PAI
Network: Solana Mainnet
```

---

## 🎯 چگونه تست کنیم؟

### روش 1: ارسال واقعی از کیف پول دیگر (توصیه می‌شود)

1. **کیف پول فرستنده (مثل Phantom):**
   ```
   - باز کنید Phantom wallet
   - برید به صفحه ارسال
   - توکن: پیدا کنید Parabolic AI (PARAI)
   - آدرس گیرنده: کپی کنید از Saturn wallet
   - مقدار: مثلاً 10 PARAI
   - ارسال کنید
   ```

2. **کیف پول گیرنده (Saturn):**
   ```
   - باز کنید Saturn wallet  
   - Settings → Developer → Testnet Mode: OFF (خیلی مهم!)
   - Home → صبر کنید 30 ثانیه
   - PARAI خودکار نمایش داده می‌شه
   ```

### روش 2: استفاده از Balance Checker

برای debug کردن و دیدن دقیق چه چیزی روی blockchain هست:

```
1. Settings → Developer → Balance Checker
2. Click "Check All Balances"
3. صبر کنید 10-20 ثانیه
4. ببینید چی روی Solana address شما هست
```

**خروجی مثال:**
```
📊 Solana (Mainnet)
Address: 7xK8YRt...9sPq
Balance: 0.5 SOL

Tokens Found:
✅ Parabolic (PAI): 100 tokens
   Mint: Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh
✅ USDC: 50 tokens
```

---

## 🔍 چک کردن Console Logs

برای debug دقیق، console browser رو چک کنید:

### 1. باز کنید Browser Console
```
کلید F12
یا
Right click → Inspect → Console tab
```

### 2. توکن پیدا شد (✅ خوبه):
```javascript
[Home] 🎯 Parabolic AI token search result: {
  symbol: "PAI",
  name: "Parabolic",
  amount: 100,
  mint: "Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh",
  decimals: 9
}
```

### 3. توکن پیدا نشد (❌ مشکل):
```javascript
[Home] 🎯 Parabolic AI token search result: null
[Home] 📊 All Solana tokens found: []
```

اگر `null` دیدید:
- Check کنید Testnet Mode خاموشه
- Check کنید Helius API Key تنظیم شده
- Check کنید توکن واقعاً ارسال شده (روی Solscan)

---

## 📋 Checklist برای تست

- [ ] **Helius API Key** تنظیم شده (Settings → Developer → API Keys)
- [ ] **Testnet Mode** خاموش است (OFF) برای mainnet tokens
- [ ] **Wallet آدرس** صحیح است (از Receive گرفتید)
- [ ] **توکن ارسال شده** روی blockchain (چک کنید با Solscan)
- [ ] **منتظر ماندید** حداقل 30-60 ثانیه بعد از ارسال
- [ ] **Refresh کردید** با دکمه refresh (🔄)
- [ ] **Console logs** چک کردید (F12)

---

## 🧪 سناریوهای تست

### تست 1: دریافت اولین توکن PARAI
```
1. Settings → Developer → Testnet Mode: OFF
2. Home → Receive → کپی آدرس Solana
3. از Phantom: ارسال 10 PARAI
4. صبر 60 ثانیه
5. Saturn: باید خودکار نمایش داده بشه
```

**انتظار:**
```
Home screen:
┌───────────────────────────┐
│ Parabolic AI (PARAI)      │
│ 10 tokens                 │
│ $0.52 (با فرض قیمت CoinGecko)
└───────────────────────────┘
```

### تست 2: دریافت PARAI بیشتر
```
1. وقتی قبلاً 10 PARAI دارید
2. دوباره 5 PARAI ارسال کنید
3. بعد از 30 ثانیه، باید 15 PARAI نشون بده
```

**انتظار:**
```
Parabolic AI: 15 tokens (بروز شده)
```

### تست 3: قیمت Real-time
```
1. وقتی PARAI دارید، قیمت از CoinGecko میاد
2. هر 10 ثانیه auto-refresh می‌شه
3. قیمت USD واقعی نمایش داده می‌شه
```

**چک کنید:**
```
Console:
[Home] ✅ Token prices fetched: { PARAI: 0.052, SOL: 142.54, ... }
```

---

## ❌ مشکلات رایج و راه‌حل

### مشکل 1: توکن نمایش داده نمی‌شه

**علل احتمالی:**
1. Testnet Mode روشنه (ON)
2. توکن هنوز confirm نشده
3. Helius API Key نیست
4. آدرس اشتباه

**راه‌حل:**
```
1. Settings → Developer → Testnet Mode → OFF
2. صبر کنید 60 ثانیه
3. Refresh کنید
4. Balance Checker رو چک کنید
```

### مشکل 2: Console میگه "null"

```javascript
[Home] 🎯 Parabolic AI token search result: null
```

**یعنی:**
- توکن روی blockchain address شما نیست
- یا network mode اشتباهه

**راه‌حل:**
```
1. Solscan.io/account/YOUR_ADDRESS رو باز کنید
2. Tab "Tokens" رو چک کنید
3. ببینید PARAI اونجا هست یا نه
```

### مشکل 3: قیمت صفر (0) نشون میده

```
Parabolic AI: 100 tokens
Value: $0.00
```

**علت:**
- CoinGecko API error داره
- Rate limit خورده

**راه‌حل:**
```
صبر کنید 2-3 دقیقه
قیمت از cache بارگذاری می‌شه
```

---

## 🎨 خروجی مورد انتظار

### صفحه Home (بعد از دریافت PARAI):

```
━━━━━━━━━━━━━━━━━━━━━━━
    Saturn Wallet
━━━━━━━━━━━━━━━━━━━━━━━

💰 Total Balance
$152.50

📊 Your Assets

┌─────────────────────────┐
│ 🤖 Parabolic AI         │
│ 100 PARAI               │
│ $5.20                   │
│ +$0.62 (+13.5%)         │
└─────────────────────────┘

┌─────────────────────────┐
│ ◎ Solana                │
│ 1.5 SOL                 │
│ $213.81                 │
│ +$11.20 (+5.5%)         │
└─────────────────────────┘

... سایر توکن‌ها
━━━━━━━━━━━━━━━━━━━━━━━
```

### Console Logs (موفق):

```javascript
[Home] 🔗 Fetching balances from blockchain APIs in MAINNET mode
[Solana] ✅ MAINNET Balance: 1.5 SOL
[Solana] Found 5 token accounts on MAINNET
[Home] 🎯 Parabolic AI token search result: {
  symbol: "PAI",
  name: "Parabolic",
  amount: 100,
  mint: "Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh"
}
[Home] 📊 All Solana tokens found: [
  { symbol: "PAI", name: "Parabolic", amount: 100, mint: "Cmgx..." },
  { symbol: "USDC", name: "USD Coin", amount: 50, mint: "EPj..." }
]
[Home] ✅ Loaded 4 tokens from blockchain
```

---

## 🔗 لینک‌های مفید برای تست

### CoinGecko (برای قیمت):
```
https://www.coingecko.com/en/coins/parabolic-ai
```

### Solscan (برای چک کردن blockchain):
```
Mainnet: https://solscan.io/token/Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh
Account: https://solscan.io/account/YOUR_WALLET_ADDRESS
```

### Solana Explorer (آلترناتیو):
```
https://explorer.solana.com/address/Cmgx4FoMTNyxWeMKso3BTWmScGgFwrryTQbMKrxNAKNh
```

---

## ✅ تست نهایی

### مراحل کامل تست:

1. **راه‌اندازی:**
   ```
   ✓ API Keys تنظیم شده (Helius)
   ✓ Testnet Mode: OFF
   ✓ Wallet باز شده
   ```

2. **ارسال توکن:**
   ```
   ✓ از Phantom: 10 PARAI فرستاده شد
   ✓ Transaction confirmed
   ✓ Signature: ABC123...xyz
   ```

3. **بررسی Saturn:**
   ```
   ✓ صبر 30 ثانیه
   ✓ Auto-refresh کار کرد
   ✓ PARAI نمایش داده شد
   ✓ مقدار: 10 tokens
   ✓ قیمت از CoinGecko آمد
   ```

4. **Console Logs:**
   ```
   ✓ "Parabolic AI token search result" → object (not null)
   ✓ "All Solana tokens found" → array با PARAI
   ✓ "Loaded X tokens from blockchain" → شامل PARAI
   ```

5. **Balance Checker:**
   ```
   ✓ PARAI در لیست هست
   ✓ Mint address صحیح است
   ✓ مقدار درست است
   ```

---

## 🎯 خلاصه

**کیف پول Saturn الان:**
- ✅ آدرس mint واقعی Parabolic AI رو میشناسه
- ✅ توکن‌های PARAI رو خودکار detect می‌کنه
- ✅ قیمت واقعی از CoinGecko میگیره
- ✅ هر 10 ثانیه auto-refresh می‌کنه
- ✅ مثل Phantom دقیقاً کار می‌کنه

**برای تست:**
1. Testnet Mode رو خاموش کنید (OFF)
2. از یک کیف پول دیگه PARAI بفرستید
3. صبر کنید 30-60 ثانیه
4. توکن خودکار نمایش داده می‌شه!

**Debug:**
- F12 → Console logs رو چک کنید
- Balance Checker رو استفاده کنید
- Solscan رو چک کنید

---

**همه چیز واقعی است! بدون mock data!** 🎉
