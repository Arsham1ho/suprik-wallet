# راهنمای رفع مشکل: موجودی نمایش داده نمی‌شود

## مشکل
کوین به والت ارسال شده ولی در صفحه Home نمایش داده نمی‌شود.

## مراحل عیب‌یابی

### مرحله ۱: بررسی آدرس دریافت
1. به Settings > Developer > **Balance Checker** بروید
2. روی دکمه "بررسی موجودی همه شبکه‌ها" کلیک کنید
3. آدرس هر blockchain را کپی کنید
4. مطمئن شوید که به همان آدرس ارسال کرده‌اید

### مرحله ۲: بررسی شبکه (Mainnet vs Testnet)
**مهم:** Saturn دو حالت دارد:
- **Mainnet**: ارزهای واقعی (پول واقعی)
- **Testnet/Devnet**: ارزهای تستی (بدون ارزش واقعی)

**چک کنید:**
1. به Settings > Developer بروید
2. وضعیت "Testnet Mode" را ببینید:
   - اگر **Active** است: روی شبکه‌های تستی هستید
   - اگر **Inactive** است: روی mainnet هستید

**آدرس‌ها در هر دو حالت یکسان هستند، ولی blockchain‌های متفاوت:**

#### Solana:
- **Mainnet**: Solana Mainnet-Beta
- **Testnet**: Solana Devnet

#### Ethereum:
- **Mainnet**: Ethereum Mainnet
- **Testnet**: Ethereum Sepolia

#### Bitcoin:
- **Mainnet**: Bitcoin Mainnet
- **Testnet**: Bitcoin Testnet

**مثال مشکل رایج:**
- والت شما روی **Testnet Mode** است
- شما کوین را به **Mainnet** ارسال کرده‌اید
- نتیجه: کوین نمایش داده نمی‌شود چون والت Testnet را چک می‌کند

**راه حل:**
1. Testnet Mode را خاموش کنید
2. بعد صفحه Home را refresh کنید (pull to refresh)

### مرحله ۳: استفاده از Balance Checker
این ابزار جدید برای دیباگ اضافه شده:

1. Settings > Developer > **Balance Checker**
2. روی "بررسی موجودی همه شبکه‌ها" کلیک کنید
3. منتظر بمانید تا موجودی واقعی از blockchain خوانده شود
4. اگر موجودی صفر است:
   - روی "مشاهده در اکسپلورر" کلیک کنید
   - تراکنش خود را پیدا کنید
   - ببینید به چه آدرسی ارسال شده

### مرحله ۴: چک کردن Transaction در Explorer
برای Solana:
- **Mainnet**: https://explorer.solana.com
- **Devnet**: https://explorer.solana.com?cluster=devnet

برای Ethereum:
- **Mainnet**: https://etherscan.io
- **Sepolia**: https://sepolia.etherscan.io

برای Bitcoin:
- **Mainnet**: https://blockstream.info
- **Testnet**: https://blockstream.info/testnet

**چک کنید:**
1. آیا transaction confirmed شده؟
2. به کدام آدرس ارسال شده؟
3. آیا آدرس با آدرس والت شما مطابقت دارد؟

### مرحله ۵: Refresh کردن
بعد از بررسی همه موارد بالا:

1. به صفحه Home بروید
2. از بالای صفحه به پایین بکشید (Pull to Refresh)
3. یا روی دکمه Refresh در گوشه بالا راست کلیک کنید
4. منتظر بمانید تا balance از blockchain خوانده شود

### مرحله ۶: چک کردن Console Logs
1. Developer Tools را باز کنید (F12)
2. به تب Console بروید
3. دنبال این پیام‌ها بگردید:

```
[Blockchain] Fetching Solana balance for ...
[Blockchain] ✅ SOL balance: X.XXXXXX SOL
```

اگر خطا می‌بینید، لاگ را برای دیباگ استفاده کنید.

## سناریوهای رایج

### سناریو ۱: ارسال SOL به Devnet در حالی که Testnet Mode خاموش است
**علائم:**
- کوین از کیف پول فرستنده کم شده
- ولی در والت Saturn نمایش داده نمی‌شود

**راه حل:**
1. Testnet Mode را فعال کنید
2. صفحه Home را refresh کنید
3. حالا باید SOL روی Devnet نمایش داده شود

### سناریو ۲: ارسال به آدرس اشتباه
**علائم:**
- Balance Checker موجودی صفر نشان می‌دهد
- ولی transaction در explorer confirmed است

**راه حل:**
- متأسفانه اگر به آدرس اشتباه ارسال کرده‌اید، قابل بازگشت نیست
- همیشه قبل از ارسال، آدرس را دوباره چک کنید

### سناریو ۳: Transaction هنوز Pending است
**علائم:**
- Balance Checker موجودی صفر نشان می‌دهد
- Transaction در explorer pending است

**راه حل:**
- چند دقیقه صبر کنید
- سپس refresh کنید
- برای Solana معمولاً کمتر از 1 دقیقه طول می‌کشد
- برای Ethereum می‌تواند 1-5 دقیقه باشد
- برای Bitcoin می‌تواند 10-60 دقیقه باشد

## دریافت توکن‌های تستی (برای Testnet)

اگر روی Testnet Mode هستید، از این faucet‌ها استفاده کنید:

### Solana Devnet Faucet
- لینک: https://faucet.solana.com
- مقدار: 1-5 SOL (تستی)
- زمان: آنی

### Ethereum Sepolia Faucet
- لینک: https://sepoliafaucet.com
- یا: https://faucet.quicknode.com/ethereum/sepolia
- مقدار: 0.1-0.5 ETH (تستی)
- زمان: 1-5 دقیقه

## لاگ‌های مهم

وقتی Balance Checker را استفاده می‌کنید، این لاگ‌ها را دنبال کنید:

```javascript
// شروع بررسی
[BalanceChecker] 🔍 Checking Solana balance...
[BalanceChecker] Network mode: mainnet (یا testnet)
[BalanceChecker] Address: ... (آدرس والت شما)

// نتیجه موفق
[BalanceChecker] ✅ Solana result: { native: X.XXX, tokens: [...] }

// خطا
[BalanceChecker] ❌ Solana error: ... (پیام خطا)
```

## تماس با پشتیبانی

اگر بعد از انجام تمام مراحل بالا همچنان مشکل دارید:

1. Screenshot از Balance Checker بگیرید
2. لینک transaction از explorer را کپی کنید
3. Console logs را کپی کنید
4. به تیم پشتیبانی اطلاع دهید

## نکات امنیتی

⚠️ **هیچ وقت:**
- Recovery phrase خود را به کسی ندهید
- Private key خود را share نکنید
- از اپ‌های fake استفاده نکنید

✅ **همیشه:**
- آدرس دریافت را دوباره چک کنید
- مقدار ارسال را تأیید کنید
- از explorer برای بررسی transaction استفاده کنید
