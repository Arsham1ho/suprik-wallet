# دستورالعمل تست کامل Saturn Wallet 🧪

این راهنما به شما کمک می‌کند که تمام ویژگی‌های Saturn Wallet را به طور کامل تست کنید.

---

## 🚀 شروع سریع

### مرحله 1: باز کردن اپلیکیشن
1. اپلیکیشن را در مرورگر باز کنید
2. منتظر بمانید تا انیمیشن Welcome نمایش داده شود
3. باید صفحه Landing با دو گزینه "Create Wallet" و "Import Wallet" را ببینید

---

## 📝 تست 1: ساخت کیف پول جدید

### گام‌ها:
1. روی **"Create Wallet"** کلیک کنید
2. **Recovery Phrase** را انتخاب کنید (یا Google Sign-In)
3. عبارت بازیابی 12 کلمه‌ای را ببینید و یادداشت کنید
4. عبارت را تأیید کنید
5. رمز عبور تنظیم کنید (حداقل 8 کاراکتر)

### نتیجه مورد انتظار:
- ✅ انیمیشن "Account Created" نمایش داده شود
- ✅ وارد صفحه Home شوید
- ✅ Username پیش‌فرض (@Account1) نمایش داده شود

### بررسی localStorage:
```javascript
// در Console مرورگر:
console.log('Encrypted Wallet:', localStorage.getItem('saturn_encrypted_wallet'));
console.log('Username:', localStorage.getItem('saturn_username'));
console.log('Wallet Name:', localStorage.getItem('saturn_wallet_name'));
```

---

## 🏠 تست 2: صفحه Home

### بررسی نمایش:
1. ✅ Avatar کاربر در بالای صفحه
2. ✅ Username (@Account1)
3. ✅ Total Balance با نمودار gradient
4. ✅ دکمه‌های Receive, Send, Swap
5. ✅ لیست توکن‌ها (SOL, ETH, BTC, USDC)

### تست Refresh:
1. روی دکمه **Refresh** (↻) کلیک کنید
2. باید پیغام "Refreshing..." نمایش داده شود
3. موجودی‌ها باید از blockchain بارگذاری شوند

### تست Pull-to-Refresh (روی موبایل):
1. صفحه را به سمت پایین بکشید
2. باید انیمیشن loading نمایش داده شود
3. موجودی‌ها باید به‌روز شوند

### بررسی Console:
```javascript
// باید این log‌ها را ببینید:
[Home] ✅ Wallet info loaded from localStorage
[Home] 🔗 Fetching balances from blockchain APIs
[Home] ✅ Loaded X tokens from blockchain
```

---

## 💰 تست 3: Receive (دریافت)

### گام‌ها:
1. روی دکمه **Receive** کلیک کنید
2. باید QR Code آدرس Solana نمایش داده شود
3. روی **Copy Address** کلیک کنید
4. باید پیغام "Address copied" نمایش داده شود

### تست Switch Network:
1. روی **Solana** کلیک کنید
2. لیست شبکه‌ها (Solana, Ethereum, Bitcoin) را ببینید
3. یک شبکه دیگر انتخاب کنید
4. QR Code باید تغییر کند

---

## 📤 تست 4: Send (ارسال)

### گام‌ها:
1. روی دکمه **Send** کلیک کنید
2. یک توکن انتخاب کنید (مثلاً SOL)
3. آدرس مقصد را وارد کنید
4. مقدار را وارد کنید
5. روی **Preview** کلیک کنید
6. تراکنش را بررسی کنید
7. روی **Send** کلیک کنید

### نتیجه مورد انتظار:
- ✅ انیمیشن sending نمایش داده شود
- ✅ پیغام موفقیت نمایش داده شود
- ✅ Transaction hash نمایش داده شود
- ✅ موجودی به‌روز شود

### ⚠️ نکته امنیتی:
برای تست، از Testnet Mode استفاده کنید یا مقدار کمی ارسال کنید.

---

## 🔄 تست 5: Swap (تبدیل)

### گام‌ها:
1. به صفحه **Swap** بروید
2. توکن مبدأ را انتخاب کنید (مثلاً SOL)
3. توکن مقصد را انتخاب کنید (مثلاً USDC)
4. مقدار را وارد کنید
5. باید قیمت و نرخ تبدیل نمایش داده شود
6. روی **Swap** کلیک کنید
7. تراکنش را تأیید کنید

### نتیجه مورد انتظار:
- ✅ قیمت real-time از Jupiter API
- ✅ نمایش کارمزد (Network + Saturn 0.1%)
- ✅ Slippage tolerance قابل تنظیم
- ✅ تأیید تراکنش
- ✅ به‌روزرسانی موجودی

---

## 📊 تست 6: Activity (تاریخچه)

### بررسی:
1. به صفحه **Activity** بروید
2. باید لیست تراکنش‌های اخیر را ببینید
3. روی یک تراکنش کلیک کنید
4. جزئیات تراکنش نمایش داده شود
5. روی **View on Explorer** کلیک کنید
6. به Solscan/Etherscan منتقل شوید

### فیلترها:
1. فیلتر All/Sent/Received/Swapped را تست کنید
2. فیلتر شبکه (All/Solana/Ethereum) را تست کنید

---

## 🔍 تست 7: CoinDetail (جزئیات توکن)

### گام‌ها:
1. در صفحه Home، روی یک توکن کلیک کنید
2. صفحه CoinDetail باز شود

### بررسی نمایش:
- ✅ قیمت real-time
- ✅ نمودار تعاملی
- ✅ تغییر 24 ساعته
- ✅ Market Cap
- ✅ توضیحات توکن

### تست نمودار:
1. روی نمودار hover کنید
2. باید tooltip با قیمت و زمان نمایش داده شود
3. بازه‌های زمانی مختلف (1H, 1D, 1W, 1M, YTD) را تست کنید

### تست دکمه‌ها:
1. **Receive:** باید QR Code برای آن توکن نمایش دهد
2. **Chat:** باید به چت عمومی توکن برود
3. **Share:** باید لینک را کپی کند

---

## 💬 تست 8: Chat (گفتگو)

### گام‌ها:
1. به صفحه **Chat** بروید
2. یک توکن انتخاب کنید
3. پیام‌های قبلی بارگذاری شوند

### تست ارسال پیام:
1. پیامی تایپ کنید
2. روی Send کلیک کنید
3. پیام باید در چت ظاهر شود
4. Username شما (@Account1) نمایش داده شود

### تست Reactions:
1. روی یک پیام long press کنید (یا کلیک راست)
2. منوی reactions نمایش داده شود
3. یک emoji انتخاب کنید
4. reaction زیر پیام نمایش داده شود

### تست Reply:
1. روی یک پیام swipe کنید (یا کلیک راست)
2. گزینه Reply نمایش داده شود
3. پیام reply بفرستید
4. باید connection به پیام اصلی نمایش داده شود

---

## ⚙️ تست 9: Settings - Account

### گام‌ها:
1. به **Settings** → **Account Settings** بروید

### تست تغییر Username:
1. username جدیدی تایپ کنید (مثلاً @SaturnUser)
2. باید real-time validation انجام شود
3. اگر username موجود باشد، پیغام خطا نمایش دهد
4. اگر در دسترس باشد، تیک سبز نمایش دهد
5. روی **Save** کلیک کنید
6. username باید در همه جا به‌روز شود

### بررسی localStorage:
```javascript
console.log('New Username:', localStorage.getItem('saturn_username'));
// باید @SaturnUser باشد
```

### تست آپلود عکس:
1. روی Avatar کلیک کنید
2. یک عکس انتخاب کنید
3. انیمیشن uploading نمایش داده شود
4. عکس در همه جا به‌روز شود

### بررسی event:
```javascript
// باید این event trigger شود:
window.addEventListener('profilePictureUpdated', () => {
  console.log('✅ Profile picture event triggered');
});
```

---

## 🔐 تست 10: Settings - Security

### تست Recovery Phrase:
1. به **Security Settings** بروید
2. روی **"I understand the risks"** کلیک کنید
3. عبارت بازیابی 12 کلمه‌ای نمایش داده شود
4. روی هر کلمه کلیک کنید تا کپی شود

### تست Password:
1. روی **Set Password** کلیک کنید
2. رمز عبور جدید وارد کنید
3. تأیید کنید
4. باید ذخیره شود

### تست Biometric (اگر موجود باشد):
1. سوئیچ Biometric را فعال کنید
2. باید Face ID/Touch ID prompt نمایش دهد
3. احراز هویت کنید
4. باید فعال شود

---

## 🎨 تست 11: Settings - Preferences

### تست Language:
1. به **Preferences** بروید
2. زبان را به Farsi تغییر دهید
3. تمام متن‌ها باید به فارسی تغییر کنند

### تست Currency:
1. ارز را به EUR تغییر دهید
2. قیمت‌ها باید به یورو نمایش داده شوند

### تست Theme:
1. به **Theme Customization** بروید
2. رنگ gradient را تغییر دهید
3. تمام صفحات باید با تم جدید نمایش داده شوند

---

## 🧪 تست 12: Testnet Mode

### فعال‌سازی:
1. به **Settings** بروید
2. سوئیچ **Testnet Mode** را فعال کنید
3. باید پیغام "Testnet Mode enabled" نمایش دهد

### بررسی:
- ✅ در صفحه Home، badge "🧪 Devnet Mode" نمایش داده شود
- ✅ تراکنش‌ها به Devnet ارسال شوند
- ✅ موجودی‌ها از Devnet بارگذاری شوند

### تست دریافت توکن تستی:
1. روی **"Test Receive Tokens"** کلیک کنید
2. توکن و مقدار انتخاب کنید
3. روی **Simulate Receive** کلیک کنید
4. موجودی باید به‌روز شود

---

## 📱 تست 13: PWA (Progressive Web App)

### نصب:
1. در مرورگر، منوی "Add to Home Screen" را پیدا کنید
2. اپ را نصب کنید
3. از home screen اپ را باز کنید

### بررسی:
- ✅ باید مثل یک اپ native باز شود
- ✅ بدون address bar مرورگر
- ✅ آیکون Saturn در لانچر
- ✅ همه ویژگی‌ها کار کنند

---

## 🐛 تست 14: Error Handling

### تست خطاهای احتمالی:

#### 1. آدرس نامعتبر در Send:
```
Input: "invalid-address"
Expected: ❌ "Invalid address format"
```

#### 2. موجودی ناکافی:
```
Input: Amount > Balance
Expected: ❌ "Insufficient balance"
```

#### 3. شبکه قطع:
```
Action: Disconnect internet
Expected: ⚠️ "Network error, please try again"
```

#### 4. رمز عبور اشتباه:
```
Input: Wrong password
Expected: ❌ "Incorrect password"
```

---

## ✅ Checklist نهایی

### صفحات اصلی:
- [ ] Home - بارگذاری موجودی
- [ ] Swap - تبدیل توکن
- [ ] Activity - تاریخچه تراکنش‌ها
- [ ] Settings - تنظیمات
- [ ] Send - ارسال توکن
- [ ] Chat - گفتگو

### ویژگی‌های کاربری:
- [ ] ساخت کیف پول جدید
- [ ] Import کیف پول
- [ ] تغییر username
- [ ] آپلود عکس پروفایل
- [ ] تغییر theme
- [ ] تغییر زبان
- [ ] Biometric authentication

### تراکنش‌ها:
- [ ] Send SOL
- [ ] Send USDC
- [ ] Swap SOL → USDC
- [ ] مشاهده تاریخچه
- [ ] مشاهده transaction on explorer

### امنیت:
- [ ] رمزنگاری seed phrase
- [ ] Lock/Unlock
- [ ] Biometric
- [ ] Recovery phrase backup

### Client-Side Storage:
- [ ] localStorage برای profile
- [ ] localStorage برای encrypted wallet
- [ ] هیچ خطای "Failed to fetch user profile"

---

## 🎯 نتایج مورد انتظار

### Console Logs (بدون خطا):
```
[Home] ✅ Wallet info loaded from localStorage
[Settings] ✅ Profile picture loaded from localStorage
[AccountSettings] ✅ Wallet info loaded from localStorage
[CoinDetail] ✅ User profile loaded from localStorage
[Chat] ✅ User profile loaded from localStorage
[SecuritySettings] ✅ Data loaded from localStorage
```

### localStorage Keys:
```javascript
saturn_username: "@YourUsername"
saturn_wallet_name: "Saturn Wallet"
saturn_profile_picture: "data:image/..." or null
saturn_encrypted_wallet: "base64..."
saturn_auth_method: "recovery-phrase"
saturn_solana_network: "mainnet-beta" or "devnet"
```

---

## 📞 گزارش مشکلات

اگر مشکلی پیدا کردید:

1. **Console را چک کنید** - آیا خطایی نمایش داده می‌شود؟
2. **localStorage را بررسی کنید** - آیا داده‌ها ذخیره شده‌اند؟
3. **Network tab را چک کنید** - آیا API calls موفق هستند؟
4. **Screenshot بگیرید** - از خطا یا مشکل
5. **مراحل را یادداشت کنید** - چطور می‌توان مشکل را تکرار کرد؟

---

**موفق باشید!** 🚀
