# 🚀 راهنمای سریع تست کیف پول Saturn

## ⚡ تست سریع (5 دقیقه)

### گام 1: ایجاد کیف پول
```
1. باز کردن اپلیکیشن
2. کلیک روی "Create a new wallet"
3. یادداشت کردن 12 کلمه seed phrase
4. تایید seed phrase
5. وارد کردن password (مثلاً: Test1234!)
```

### گام 2: چک کردن آدرس‌ها
```
1. رفتن به Settings (آیکون تنظیمات در نوار پایین)
2. کلیک روی "Account Settings"
3. مشاهده آدرس‌ها برای هر شبکه:
   ✓ Solana (Base58)
   ✓ Ethereum (0x...)
   ✓ Bitcoin (bc1...)
   ✓ Base (0x... - مثل Ethereum)
   ✓ Polygon (0x... - مثل Ethereum)
   ✓ Sui (0x...)
```

### گام 3: فعال کردن Testnet Mode
```
1. رفتن به Settings
2. پیدا کردن بخش "Developer Options"
3. کلیک روی "Enable Testnet Mode"
4. انتخاب "Devnet" برای Solana
5. ✅ حالا در حالت تست هستید (بدون خرج کردن پول واقعی)
```

### گام 4: دریافت Testnet SOL
```
1. رفتن به Account Settings
2. کلیک روی "Solana" و کپی کردن آدرس
3. رفتن به https://faucet.solana.com
4. paste کردن آدرس و درخواست 1 SOL
5. صبر کردن 10-30 ثانیه
6. رفتن به صفحه Home
7. ✅ باید موجودی SOL نمایش داده شود (مثلاً 1.0 SOL)
```

### گام 5: تست Send
```
1. کلیک روی دکمه "Send" در صفحه Home
2. انتخاب SOL
3. وارد کردن آدرس گیرنده (می‌توانید آدرس خودتان را دوباره paste کنید)
4. وارد کردن مقدار: 0.01
5. کلیک روی "Review"
6. کلیک روی "Send"
7. وارد کردن password
8. ✅ باید transaction ارسال شود و signature نمایش داده شود
```

### گام 6: تست Swap
```
1. رفتن به صفحه "Swap" (آیکون تبدیل در نوار پایین)
2. From: SOL
3. To: USDC (جستجو کنید اگر لیست نیست)
4. Amount: 0.1
5. کلیک روی "Get Quote"
6. بررسی قیمت
7. کلیک روی "Swap"
8. وارد کردن password
9. ✅ باید swap انجام شود
10. ✅ موجودی SOL کم و USDC زیاد می‌شود
```

## 🎯 نکات مهم

### آدرس‌های Unique برای هر کاربر
- هر کاربر با seed phrase خود، آدرس‌های منحصر به فرد دریافت می‌کند
- همین seed phrase در wallet های دیگر (مثل Phantom) هم کار می‌کند
- آدرس Ethereum = Base = Polygon (چون همه EVM هستند)

### نمایش موجودی
- موجودی مستقیم از blockchain خوانده می‌شود (نه از database)
- هر 10 ثانیه خودکار refresh می‌شود
- تمام SPL tokens خودکار شناسایی و نمایش داده می‌شوند

### Send و Swap
- تمام transaction ها 100% واقعی هستند
- Private key هرگز از مرورگر خارج نمی‌شود
- در testnet mode، پول واقعی خرج نمی‌شود

## 🧪 سناریوهای تست پیشرفته

### تست Multi-Account
```
1. رفتن به Settings > Account Settings
2. کلیک روی "Add Account"
3. ✅ Account جدید با آدرس‌های متفاوت ساخته می‌شود
4. می‌توانید بین account ها switch کنید
```

### تست Import Wallet
```
1. کلیک روی "Import existing wallet"
2. وارد کردن seed phrase (12 کلمه)
3. وارد کردن password جدید
4. ✅ wallet import می‌شود با همان آدرس‌ها
```

### تست Ethereum/Base/Polygon
```
1. فعال کردن Testnet Mode
2. انتخاب "Sepolia" برای Ethereum
3. کپی کردن Ethereum address
4. دریافت testnet ETH از https://sepoliafaucet.com
5. ✅ موجودی ETH باید نمایش داده شود
```

### تست Bitcoin
```
1. کپی کردن Bitcoin address (bc1...)
2. دریافت testnet BTC از https://testnet-faucet.mempool.co
3. ✅ موجودی BTC باید نمایش داده شود
```

## 📊 Console Logs برای Debug

اگر مشکلی پیش آمد، F12 را بزنید و console را چک کنید:

```javascript
// بررسی آدرس‌ها
[Wallet] 🔑 Addresses derived: { solana: "...", ethereum: "...", ... }

// بررسی موجودی
[Blockchain] ✅ SOL balance on devnet: 1.000000 SOL
[Blockchain] ✅ Found 2 SPL tokens

// بررسی transaction
[Transactions] ✅ Transaction sent successfully
[Transactions] Signature: 2QvM...
```

## ❓ عیب‌یابی سریع

### موجودی نمایش داده نمی‌شود
```
✓ آیا wallet unlock شده است؟
✓ آیا در حالت testnet هستید؟
✓ آیا از faucet توکن دریافت کرده‌اید؟
✓ صبر کنید تا 30 ثانیه (auto-refresh)
✓ F12 → Console را چک کنید
```

### Send کار نمی‌کند
```
✓ آیا موجودی کافی دارید؟
✓ آیا آدرس گیرنده valid است؟
✓ آیا مقدار از balance شما کمتر است؟
✓ آیا fee را در نظر گرفته‌اید؟
```

### Swap کار نمی‌کند
```
✓ آیا در Solana mainnet یا devnet هستید؟
✓ آیا موجودی SOL کافی دارید؟
✓ آیا از توکن‌های پشتیبانی شده استفاده می‌کنید؟
```

## ✅ تایید نهایی

اگر همه این تست‌ها با موفقیت انجام شد، پس:

✅ **Wallet به درستی کار می‌کند**
✅ **آدرس‌های unique برای هر شبکه تولید می‌شود**
✅ **موجودی واقعی از blockchain نمایش داده می‌شود**
✅ **Send و Swap به درستی کار می‌کنند**
✅ **عملکرد دقیقاً مانند Phantom است**

---

**نکته**: همیشه seed phrase خود را در جای امن نگه دارید. هر کسی که seed phrase شما را داشته باشد، می‌تواند به wallet شما دسترسی داشته باشد!
