# 🪐 Saturn Wallet - اسکریپت دمو
## راهنمای ارائه محصول به مدیریت

---

## 🎬 پیش از دمو

### ✅ Checklist:
- [ ] Browser باز است (Chrome/Firefox)
- [ ] اتصال اینترنت stable است
- [ ] Screen recording آماده (اختیاری)
- [ ] Backup seed phrase آماده: `[12-word phrase]`
- [ ] Laptop/Phone شارژ کافی دارد
- [ ] Notifications خاموش است
- [ ] Tab های اضافی بسته شده

### 📱 Demo Environment:
- **URL:** [Your Vercel/Netlify URL]
- **Test Wallet ID:** [از قبل ساخته شده]
- **Test Username:** @demo_user

---

## 🎭 اسکریپت دمو (15-20 دقیقه)

---

## **بخش 1️⃣: Landing Page & Onboarding (2 دقیقه)**

### **صحبت:**
> "به Saturn Wallet خوش آمدید. این یک کیف پول ارزهای دیجیتال است که با الهام از Phantom طراحی شده. بیایید فرآیند ساخت wallet را ببینیم."

### **اکشن:**
1. **صفحه Landing را نشان دهید**
   - Logo و gradient animation
   - دکمه "Get Started"

2. **روی "Get Started" کلیک کنید**
   - Welcome animation پخش می‌شود
   - دو گزینه: "Create Wallet" و "Sign In"

### **صحبت:**
> "کاربران می‌توانند wallet جدید بسازند یا با seed phrase موجود وارد شوند. همچنین می‌توانند با Google وارد شوند."

3. **روی "Create Wallet" کلیک کنید**
   - 12-word seed phrase نمایش داده می‌شود
   - دکمه "Copy" و "I saved it, Continue"

### **صحبت:**
> "اینجا 12 کلمه seed phrase تولید می‌شود. این کلمات مانند کلید خانه شماست - اگر گم شود، هیچ کس نمی‌تواند دارایی‌ها را بازیابی کند. ما این کلمات را ذخیره نمی‌کنیم."

4. **روی "Copy" و سپس "Continue" کلیک کنید**
   - Animation "Account Created Successfully" نمایش داده می‌شود
   - Redirect به Home page

---

## **بخش 2️⃣: Home Page - Portfolio View (3 دقیقه)**

### **صحبت:**
> "حالا در داخل wallet هستیم. این صفحه اصلی است که balance کل و token های کاربر را نشان می‌دهد."

### **اکشن:**
1. **Home page را نشان دهید**
   - Balance کل در بالا (مثلاً $24,584.32)
   - Avatar و username
   - دکمه‌های Send و Receive

### **توضیح:**
```
👁️ Balance: نمایش مجموع ارزش تمام token ها در USD
🎨 Avatar: تصویر profile کاربر
📱 Bottom Nav: Home, Swap, Activity, Settings
```

2. **Scroll کنید به لیست token ها**
   - SOL: 245.32 ($34,990.51) ↑5.23%
   - ETH: 2.543 ($7,265.85) ↓2.15%
   - USDC: 10,000 ($10,000.00) ↑0.01%
   - MATIC: 1,250.5 ($1,062.93) ↑8.45%

### **صحبت:**
> "هر token با قیمت real-time از CoinGecko نمایش داده می‌شود. فلش سبز یا قرمز تغییر 24 ساعته را نشان می‌دهد."

3. **روی یک token کلیک کنید (مثلاً SOL)**
   - صفحه جزئیات token باز می‌شود
   - نمودار قیمتی (1D, 1W, 1M, 1Y)
   - دکمه‌های Send, Receive, Swap

### **صحبت:**
> "اینجا می‌توانیم نمودار قیمتی و اطلاعات کامل token را ببینیم."

4. **Back کنید به Home**

---

## **بخش 3️⃣: Swap Feature (4 دقیقه)**

### **صحبت:**
> "یکی از قابلیت‌های کلیدی Saturn، Swap است. بیایید SOL را به USDC تبدیل کنیم."

### **اکشن:**
1. **روی tab "Swap" در bottom nav کلیک کنید**
   - صفحه Swap باز می‌شود
   - دو فیلد: "You pay" و "You receive"

2. **Swap را setup کنید:**
   - **From:** SOL (انتخاب شده)
   - **To:** USDC را search کنید
   - **Amount:** 10 SOL

### **صحبت:**
> "من 10 SOL می‌خواهم به USDC swap کنم. قیمت real-time محاسبه می‌شود."

3. **منتظر بمانید تا محاسبه شود**
   - Exchange rate نمایش داده می‌شود
   - Fee: 0.5% ($7.13)
   - Slippage: 0.5%
   - Total deducted: 10.05 SOL

### **توضیح:**
```
💱 Exchange Rate: 1 SOL ≈ 142.54 USDC
💰 Fee: 0.5% (شفاف)
📊 Slippage: قابل تنظیم (0.1% - 3%)
✅ Total: مقدار کل که کسر می‌شود
```

4. **روی "Swap" کلیک کنید**
   - **انیمیشن زیبای swap شروع می‌شود:**
     - Particle effects
     - Token icons با glow rings
     - Animated SVG path
     - Progress dots
   - پس از 2-3 ثانیه: Success toast

### **صحبت:**
> "توجه کنید به انیمیشن swap - این برای UX بهتر است. کاربر می‌داند که چه اتفاقی دارد می‌افتد."

5. **Transaction receipt نمایش داده می‌شود**
   - Swapped: 10 SOL → 1,425.40 USDC
   - Fee: $7.13
   - Timestamp
   - دکمه "View in Activity"

---

## **بخش 4️⃣: Send Feature (3 دقیقه)**

### **صحبت:**
> "حالا بیایید ببینیم چطور می‌توانیم crypto ارسال کنیم."

### **اکشن:**
1. **Back به Home page**
2. **روی دکمه "Send" کلیک کنید**
   - Dialog باز می‌شود
   - فیلدها: Token, Amount, Recipient

3. **Send را setup کنید:**
   - **Token:** USDC
   - **Amount:** 100
   - **Recipient:** یا آدرس blockchain یا @username

### **صحبت:**
> "کاربر می‌تواند به آدرس blockchain یا به username دیگر کاربران Saturn ارسال کند - مثل Venmo!"

4. **دکمه "Preview" را بزنید**
   - صفحه preview با breakdown:
     - Amount: 100 USDC
     - Fee: 0.5 USDC (0.5%)
     - Total: 100.5 USDC
   - دکمه "Confirm Send"

5. **(اختیاری) روی "Confirm" کلیک کنید**
   - Biometric prompt (اگر enabled باشد)
   - Loading animation
   - Success message
   - Transaction receipt

### **نکته:**
> در demo واقعی، تراکنش on-chain ارسال می‌شود و fee به wallet مخصوص transfer می‌شود.

---

## **بخش 5️⃣: Receive Feature (1 دقیقه)**

### **صحبت:**
> "برای دریافت، کاربر می‌تواند QR code یا آدرس را share کند."

### **اکشن:**
1. **روی دکمه "Receive" کلیک کنید**
   - Dialog باز می‌شود
   - QR code نمایش داده می‌شود
   - آدرس Solana
   - دکمه "Copy Address"

2. **روی "Copy Address" کلیک کنید**
   - Toast: "Address copied!"

### **صحبت:**
> "خیلی ساده - فقط QR code را اسکن کنید یا آدرس را کپی کنید."

---

## **بخش 6️⃣: Activity History (2 دقیقه)**

### **صحبت:**
> "تمام تراکنش‌ها در صفحه Activity ذخیره می‌شوند."

### **اکشن:**
1. **روی tab "Activity" کلیک کنید**
   - لیست تراکنش‌ها:
     - ✅ Swapped 10 SOL → 1,425 USDC
     - ✅ Sent 100 USDC to @user123
     - ✅ Received 50 SOL from 0x7Ab3...

2. **روی یک تراکنش کلیک کنید**
   - جزئیات کامل:
     - Type: Swap
     - Amount
     - Fee
     - Timestamp
     - Status
     - On-chain signature (link به explorer)

### **صحبت:**
> "کاربر می‌تواند تاریخچه کامل را ببیند، فیلتر کند، و حتی link به blockchain explorer داشته باشد."

---

## **بخش 7️⃣: Chat Feature (Token-Gated) (2 دقیقه)**

### **صحبت:**
> "یکی از ویژگی‌های منحصر به فرد Saturn، chat است. فقط کسانی که token دارند می‌توانند وارد شوند."

### **اکشن:**
1. **(اگر نیست) یک token به wallet اضافه کنید**
2. **Menu → Chat**
   - صفحه chat باز می‌شود
   - Username field با @
   - پیام‌های دیگر کاربران

3. **یک پیام بفرستید**
   - "Hello from Saturn! 🪐"
   - پیام فوراً نمایش داده می‌شود

### **صحبت:**
> "این یک community است. فقط دارندگان token می‌توانند chat کنند - token-gated."

---

## **بخش 8️⃣: Settings & Customization (2 دقیقه)**

### **صحبت:**
> "کاربر می‌تواند wallet خود را شخصی‌سازی کند."

### **اکشن:**
1. **روی tab "Settings" کلیک کنید**
   - منوی تنظیمات

2. **Account Settings:**
   - تغییر username
   - آپلود profile picture
   - Bio

3. **Security Settings:**
   - Enable biometric lock
   - Change password
   - View recovery phrase (با warning)

4. **Preferences:**
   - **Language:** English / فارسی
   - **Currency:** USD / EUR / IRR
   - **Theme:** Custom colors

### **صحبت:**
> "همه چیز قابل شخصی‌سازی است. حتی می‌توان زبان را به فارسی تغییر داد."

5. **(Demo) زبان را به فارسی تغییر دهید**
   - تمام UI به فارسی تبدیل می‌شود (RTL)

6. **دوباره به انگلیسی برگردانید**

---

## **بخش 9️⃣: NFT Gallery (1 دقیقه)**

### **اکشن:**
1. **Settings → NFT Gallery**
   - Grid view از NFT ها (اگر دارد)
   - یا empty state: "No NFTs yet"

### **صحبت:**
> "کاربر می‌تواند NFT های خود را ببیند و مدیریت کند."

---

## **بخش 🔟: Fee Admin Dashboard (Bonus) (1 دقیقه)**

### **صحبت:**
> "برای مدیریت، ما یک dashboard مخصوص داریم که fee های جمع شده را نشان می‌دهد."

### **اکشن:**
1. **URL مستقیم: `/fee-admin`**
   - کل fee های collected
   - Breakdown براساس token
   - تاریخچه fee transfers
   - On-chain signatures

### **توضیح:**
```
📊 Total Collected: $1,234.56
💰 Fee Wallet: CWvF...hPdX
✅ On-chain verified: 98%
```

---

## **🎬 پایان دمو - Q&A**

### **جمع‌بندی:**
> "خلاصه، Saturn Wallet یک محصول کامل است که:
> 
> ✅ Multi-blockchain (SOL, ETH, BTC, MATIC, ...)
> ✅ Swap با قیمت real-time
> ✅ Send به آدرس یا username
> ✅ Token-gated chat
> ✅ Beautiful UI با animations
> ✅ چندزبانگی (EN/FA)
> ✅ Fee system شفاف (0.5%)
> ✅ آماده برای launch!"

### **سوالات متداول:**

**Q: آیا امن است؟**
> A: بله، non-custodial است. کلیدها روی دستگاه کاربر. ما seed phrase را ذخیره نمی‌کنیم.

**Q: چطور درآمد کسب می‌کنید؟**
> A: از طریق 0.5% fee در هر swap/send. شفاف و رقابتی.

**Q: چه blockchain هایی پشتیبانی می‌شود؟**
> A: Solana, Ethereum, Bitcoin, Polygon و 10,000+ token از CoinGecko.

**Q: آیا mobile app هم دارید؟**
> A: فعلاً PWA است - کار می‌کند روی موبایل و دسکتاپ. React Native app در roadmap است.

**Q: چه مدت طول کشید این را بسازید؟**
> A: تقریباً 40-60 ساعت توسعه. معماری تمیز و مقیاس‌پذیر.

---

## 📝 نکات مهم در حین دمو

### ✅ Do's:
- صحبت آرام و واضح
- منتظر بمانید animationها تمام شوند
- نشان دهید FEE هر جا هست
- تأکید کنید روی SECURITY
- UX و animations را highlight کنید
- مقایسه کنید با رقبا (Phantom, MetaMask)

### ❌ Don'ts:
- عجله نکنید
- بین demo ها tab switch نکنید
- internet connection را check نکنید mid-demo
- خیلی technical نشوید (مگر بپرسند)

---

## 🎯 Key Messages

1. **"Non-custodial = کاربر مالک کلیدهاست"**
2. **"0.5% fee شفاف و رقابتی"**
3. **"Truly multi-blockchain - نه فقط Solana یا Ethereum"**
4. **"UX مثل Phantom - اما با ویژگی‌های بیشتر"**
5. **"Token-gated chat - منحصر به فرد"**
6. **"آماده برای launch همین الان!"**

---

## 📞 بعد از دمو

### Follow-up Actions:
1. ✉️ ارسال email با لینک‌های مستندات:
   - `EXECUTIVE_PRESENTATION_FA.md`
   - `PITCH_DECK_FA.md`
   - `EXECUTIVE_FAQ_FA.md`

2. 📅 زمان‌بندی جلسه بعدی:
   - Technical deep dive
   - Security discussion
   - Financial projections

3. 🤝 درخواست feedback:
   - چه چیزی دوست داشتند؟
   - چه concerns دارند؟
   - چه سوالاتی دارند؟

---

**🪐 Good luck with your demo!**

---

**تهیه شده توسط:** تیم Saturn  
**آخرین بروزرسانی:** نوامبر 2025
