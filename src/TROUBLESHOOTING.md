# Saturn Wallet - Troubleshooting Guide 🔧

راهنمای حل مشکلات رایج در Saturn Wallet

---

## ❌ خطای "Failed to decrypt mnemonic"

### علائم:
```
Failed to decrypt mnemonic: OperationError
[WalletContext] Failed to decrypt mnemonic
```

### علل احتمالی:
1. **رمز عبور اشتباه** - رایج‌ترین دلیل
2. **داده رمزنگاری شده خراب** - localStorage آسیب دیده
3. **Security context تغییر کرده** - تغییر از HTTP به HTTPS یا domain

### راه‌حل‌ها:

#### ✅ راه‌حل 1: رمز عبور صحیح را وارد کنید
- مطمئن شوید Caps Lock خاموش است
- رمز عبوری که هنگام ساخت wallet وارد کردید را وارد کنید

#### ✅ راه‌حل 2: پاک کردن cache مرورگر
```javascript
// در Console مرورگر:
localStorage.clear();
location.reload();
```
⚠️ **هشدار**: این کار wallet شما را پاک می‌کند! قبل از انجام، recovery phrase خود را داشته باشید.

#### ✅ راه‌حل 3: وارد کردن دوباره wallet با recovery phrase
1. روی "Import Wallet" کلیک کنید
2. 12 کلمه recovery phrase خود را وارد کنید
3. یک رمز عبور جدید تنظیم کنید

#### ✅ راه‌حل 4: بررسی console برای جزئیات بیشتر
```javascript
// در DevTools Console:
const stored = localStorage.getItem('saturn_encrypted_wallet');
console.log('Encrypted data exists:', !!stored);
console.log('Data length:', stored?.length);
```

---

## ❌ خطای "Failed to fetch tokens: 503"

### علائم:
```
[Ethereum] ⚠️ Failed to fetch ERC20 tokens: Token fetch failed
[Ethereum] ⚠️ Failed to fetch tokens: 503
```

### علل احتمالی:
1. **Alchemy API در دسترس نیست** - خطای موقت سرور
2. **API key نادرست یا منقضی شده**
3. **Rate limit تمام شده**
4. **مشکل شبکه**

### راه‌حل‌ها:

#### ✅ راه‌حل 1: صبر کنید و دوباره تلاش کنید
- خطای 503 معمولاً موقتی است
- 30-60 ثانیه صبر کنید
- صفحه را refresh کنید

#### ✅ راه‌حل 2: بررسی API Keys در Supabase
1. به Supabase Dashboard بروید
2. Settings → Edge Functions → Secrets
3. بررسی کنید که `ALCHEMY_API_KEY` تنظیم شده باشد
4. API key جدید از Alchemy دریافت کنید اگر لازم است

#### ✅ راه‌حل 3: بررسی وضعیت Alchemy API
- به https://status.alchemy.com بروید
- بررسی کنید که سرویس‌ها online هستند

#### ✅ راه‌حل 4: استفاده از Testnet Mode
```
Settings → Developer → Toggle Testnet Mode
```
- Testnet ممکن است مشکلات کمتری داشته باشد
- برای testing مناسب است

#### ✅ راه‌حل 5: حالت Manual Refresh
1. به Settings بروید
2. Developer → Balance Checker
3. روی "Refresh Balances" کلیک کنید

---

## ⚠️ Tokens نمایش داده نمی‌شوند

### بررسی‌های اولیه:

#### 1. آیا واقعاً tokens در wallet هست؟
- آدرس Solana خود را در Solscan بررسی کنید:
  ```
  https://solscan.io/account/[YOUR_ADDRESS]
  ```
- آدرس Ethereum خود را در Etherscan بررسی کنید:
  ```
  https://etherscan.io/address/[YOUR_ADDRESS]
  ```

#### 2. شبکه صحیح را انتخاب کرده‌اید؟
- Settings → Developer → Testnet Mode
- مطمئن شوید در شبکه‌ای هستید که tokens در آن ارسال شده‌اند

#### 3. تراکنش confirm شده؟
- تراکنش‌های blockchain به زمان نیاز دارند
- Solana: 5-30 ثانیه
- Ethereum: 1-5 دقیقه
- Bitcoin: 10-60 دقیقه

### راه‌حل‌ها:

#### ✅ راه‌حل 1: Manual Refresh
```
Pull down (swipe down) در صفحه Home
```

#### ✅ راه‌حل 2: Clear Cache و Reload
```javascript
// در Console:
localStorage.removeItem('saturn_token_logos');
location.reload();
```

#### ✅ راه‌حل 3: بررسی Console Logs
1. F12 → Console
2. دنبال خطاهای قرمز بگردید
3. اسکرین‌شات بگیرید و گزارش دهید

---

## 🔐 مشکلات Biometric Lock

### علائم:
- Face ID/Touch ID کار نمی‌کند
- "Biometric authentication failed"

### راه‌حل‌ها:

#### ✅ راه‌حل 1: بررسی مجوزها
- Settings → Privacy → Safari → Camera/Touch ID
- مطمئن شوید مجوزها فعال هستند

#### ✅ راه‌حل 2: استفاده از رمز عبور
- روی "Use Password" کلیک کنید
- با رمز عبور معمولی وارد شوید

#### ✅ راه‌حل 3: غیرفعال/فعال کردن دوباره
1. Settings → Security
2. Biometric Lock را خاموش کنید
3. 5 ثانیه صبر کنید
4. دوباره روشن کنید

---

## 📱 مشکلات PWA Installation

### علائم:
- دکمه "Install App" نمایش داده نمی‌شود
- اپ نصب نمی‌شود

### پیش‌نیازها:
- ✅ HTTPS فعال باشد (نه HTTP)
- ✅ Service Worker ثبت شده باشد
- ✅ manifest.json در دسترس باشد

### راه‌حل‌ها:

#### iOS Safari:
1. روی Share button کلیک کنید (مربع با فلش)
2. "Add to Home Screen" را انتخاب کنید
3. روی "Add" کلیک کنید

#### Android Chrome:
1. منو سه‌نقطه را باز کنید
2. "Install App" یا "Add to Home Screen"
3. تأیید کنید

#### Desktop Chrome:
1. نوار آدرس → آیکون نصب (➕)
2. "Install" کلیک کنید

---

## 💸 تراکنش‌ها شکست می‌خورند

### علائم:
- "Transaction failed"
- "Insufficient funds"
- "Slippage tolerance exceeded"

### راه‌حل‌ها:

#### ✅ موجودی کافی دارید؟
- بررسی کنید برای fee کافی موجودی داشته باشید
- Solana: حداقل 0.001 SOL
- Ethereum: حداقل 0.001 ETH برای gas

#### ✅ Slippage را افزایش دهید (برای Swap)
```
Swap صفحه → Settings (⚙️) → Slippage: 2-5%
```

#### ✅ Gas Price را افزایش دهید (Ethereum)
- در صفحه confirm تراکنش
- "Edit Fee" → "Fast" یا "Instant"

#### ✅ شبکه را بررسی کنید
- آیا blockchain فعال است؟
- آیا internet connection دارید؟

---

## 🔄 مشکلات Swap

### علائم:
- "No route found"
- "Insufficient liquidity"
- Swap کار نمی‌کند

### راه‌حل‌ها:

#### ✅ Liquidity موجود است؟
- برخی token pairs نقدینگی کمی دارند
- token های معروف‌تر را امتحان کنید (SOL, ETH, USDC)

#### ✅ مقدار را کاهش دهید
- مقدار کمتری swap کنید
- احتمالاً liquidity برای مقدار بزرگ کافی نیست

#### ✅ Slippage را افزایش دهید
```
1% → 3% → 5% (برای volatile tokens)
```

---

## 🌐 مشکلات شبکه

### تشخیص:
```javascript
// در Console:
navigator.onLine  // باید true باشد
```

### راه‌حل‌ها:
1. بررسی اتصال اینترنت
2. VPN را خاموش/روشن کنید
3. DNS را تغییر دهید (8.8.8.8)
4. مرورگر را restart کنید

---

## 📞 دریافت کمک بیشتر

### قبل از گزارش مشکل:

1. **Console Logs را جمع‌آوری کنید**:
   - F12 → Console
   - اسکرین‌شات از خطاها

2. **اطلاعات سیستم**:
   - مرورگر و نسخه
   - سیستم‌عامل
   - شبکه‌ای که استفاده می‌کنید

3. **مراحل بازتولید مشکل**:
   - چه کاری انجام دادید؟
   - چه اتفاقی افتاد؟
   - چه چیزی انتظار داشتید؟

### کانال‌های پشتیبانی:
- GitHub Issues
- Discord Community
- Email Support

---

## 🛡️ نکات امنیتی

### ✅ انجام دهید:
- Recovery phrase را در جای امن نگه دارید
- از رمزهای قوی استفاده کنید
- Biometric lock را فعال کنید
- تراکنش‌ها را قبل از confirm بررسی کنید
- اول در Testnet تست کنید

### ❌ انجام ندهید:
- Recovery phrase را به اشتراک نگذارید
- از اسکرین‌شات recovery phrase گرفتن
- رمز عبور را فراموش کنید (راه بازیابی ندارد!)
- به لینک‌های مشکوک کلیک کنید
- Private key را export کنید (مگر ضروری باشد)

---

## 📊 داده‌های تشخیصی

### کدهای مفید برای Debug:

```javascript
// در Browser Console:

// 1. بررسی وضعیت wallet
console.log('Wallet exists:', !!localStorage.getItem('saturn_encrypted_wallet'));
console.log('Wallet ID:', localStorage.getItem('saturn_wallet_id'));

// 2. بررسی token cache
const tokenLogos = localStorage.getItem('saturn_token_logos');
if (tokenLogos) {
  const data = JSON.parse(tokenLogos);
  console.log('Token logos cached:', Object.keys(data.logos).length);
  console.log('Cache age:', Date.now() - data.timestamp, 'ms');
}

// 3. بررسی Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length);
});

// 4. بررسی اتصال
console.log('Online:', navigator.onLine);
console.log('Connection:', navigator.connection?.effectiveType);

// 5. پاک کردن همه‌چیز (فقط برای debug!)
// ⚠️ DANGER: این wallet شما را پاک می‌کند!
// localStorage.clear();
// sessionStorage.clear();
```

---

آیا مشکل شما حل نشد؟ لطفاً یک issue در GitHub ایجاد کنید یا با support تماس بگیرید. 🙏
