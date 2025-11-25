# 🪐 راهنمای Jupiter Swap - معاملات واقعی

## ✅ پیاده‌سازی کامل شد!

اکنون Saturn Wallet از **Jupiter Aggregator** برای swap های واقعی on-chain استفاده می‌کند! 🎉

---

## 🚀 ویژگی‌های جدید

### 1. ✅ Swap واقعی روی Blockchain
- تمام swap های SOL حالا روی Solana blockchain اجرا می‌شوند
- استفاده از Jupiter v6 API برای بهترین قیمت
- تراکنش‌های واقعی با signature قابل مشاهده در Solscan

### 2. 🎯 بهترین قیمت ممکن
- Jupiter از تمام DEX های Solana قیمت می‌گیرد (Raydium, Orca, Serum, و...)
- Split routes برای بهترین execution
- کمترین price impact ممکن

### 3. 📊 اطلاعات دقیق
- Real-time price quotes از Jupiter
- نمایش price impact
- نمایش مسیر swap (route)
- Slippage protection

### 4. 🔐 امنیت بالا
- تمام تراکنش‌ها با private key wallet شما امضا می‌شوند
- Priority fees قابل تنظیم
- Transaction confirmation در blockchain

---

## 📖 نحوه استفاده

### مرحله 1: انتخاب توکن‌ها
```
1. وارد صفحه "Swap" شوید
2. در "You pay" توکن SOL را انتخاب کنید
3. در "You receive" هر توکن دیگری را انتخاب کنید (مثل USDC, BONK, ...)
```

### مرحله 2: وارد کردن مقدار
```
1. مقدار SOL مورد نظر را وارد کنید
2. منتظر بمانید تا Jupiter بهترین قیمت را پیدا کند
3. مقدار دریافتی به صورت خودکار محاسبه می‌شود
```

### مرحله 3: بررسی جزئیات
```
✅ Banner سبز رنگ نشان می‌دهد: "Real On-Chain Swap powered by Jupiter"
✅ Price Impact: نشان می‌دهد swap چقدر بر قیمت تأثیر می‌گذارد
✅ Route: نشان می‌دهد از کدام DEX ها استفاده می‌شود
✅ Slippage: حداکثر اختلاف قیمت قابل قبول
```

### مرحله 4: اجرای Swap
```
1. روی دکمه "🪐 Swap on Jupiter" کلیک کنید
2. منتظر بمانید تا تراکنش تأیید شود (معمولاً 5-10 ثانیه)
3. پیام موفقیت با transaction signature نمایش داده می‌شود
4. می‌توانید transaction را در Solscan مشاهده کنید
```

---

## 💡 نمونه کاربرد

### Swap 1: SOL → USDC
```
Input:  1 SOL
Output: ~140 USDC (بسته به قیمت)
Route:  SOL → Raydium → USDC
Price Impact: < 0.01%
Fee: ~0.005 SOL
Status: ✅ On-chain
```

### Swap 2: SOL → BONK
```
Input:  0.5 SOL
Output: ~70,000 BONK (بسته به قیمت)
Route:  SOL → Orca → BONK
Price Impact: 0.12%
Fee: ~0.0025 SOL
Status: ✅ On-chain
```

---

## 🎨 نشانه‌های بصری

### ✅ Banner سبز
```
🪐 Real On-Chain Swap powered by Jupiter Aggregator
Route: SOL → Raydium → USDC
```
این banner نشان می‌دهد swap شما واقعی است و روی blockchain اجرا می‌شود.

### 📊 Price Impact
- **سبز (< 1%)**: عالی - قیمت تقریباً تغییر نمی‌کند
- **زرد (1-5%)**: قابل قبول - کمی بر قیمت تأثیر دارد
- **قرمز (> 5%)**: هشدار - تأثیر زیاد بر قیمت

### 🔄 دکمه Swap
```
عادی:    "Swap"
Jupiter:  "🪐 Swap on Jupiter"
Loading:  "Getting quote..."
Swapping: "Swapping on-chain..."
```

---

## ⚙️ تنظیمات

### Slippage Tolerance
```
0.1%: برای توکن‌های پرنقدینگی (SOL, USDC)
0.5%: توصیه شده (پیش‌فرض)
1.0%: برای توکن‌های کم نقدینگی
3.0%: برای توکن‌های خیلی کم نقدینگی
```

**نکته**: Slippage بالاتر = احتمال موفقیت بیشتر، اما ممکن است قیمت بدتری دریافت کنید

### Priority Fee
```
Low:      معمولی (5-10 ثانیه)
Medium:   توصیه شده (3-5 ثانیه)
High:     سریع (1-3 ثانیه)
VeryHigh: فوری (< 1 ثانیه)
```

**نکته**: Fee بالاتر = تراکنش سریع‌تر

---

## 🔧 توکن‌های پشتیبانی شده

### ✅ Swap واقعی (با Jupiter):
```
SOL   → همه توکن‌ها ✅
USDC  → (به زودی)
USDT  → (به زودی)
BONK  → (به زودی)
```

**فعلاً فقط SOL به عنوان input token پشتیبانی می‌شود.**

### 📝 توکن‌های قابل دریافت:
```
✅ USDC  - USD Coin
✅ USDT  - Tether
✅ BONK  - Bonk
✅ JUP   - Jupiter
✅ WIF   - dogwifhat
✅ JTO   - Jito
✅ PYTH  - Pyth Network
✅ RAY   - Raydium
✅ ORCA  - Orca
✅ PAI   - Parabolic AI
... و بیشتر
```

---

## 🐛 عیب‌یابی

### مشکل: "Could not get price quote"
**راه حل**:
1. مطمئن شوید اینترنت متصل است
2. مقدار وارد شده معتبر است (> 0)
3. توکن input باید SOL باشد
4. چند لحظه صبر کنید و دوباره تلاش کنید

### مشکل: "Transaction failed"
**راه حل**:
1. بررسی موجودی کافی برای fee
2. Slippage را افزایش دهید (Settings)
3. Priority fee را افزایش دهید
4. در زمان دیگری تلاش کنید (traffic کمتر)

### مشکل: "Insufficient balance"
**راه حل**:
1. مقدار کمتری وارد کنید
2. به خاطر داشته باشید که نیاز به SOL برای transaction fee دارید
3. حداقل 0.01 SOL برای fee نگه دارید

---

## 📊 مقایسه: Swap واقعی vs شبیه‌سازی

| ویژگی | Swap واقعی (Jupiter) | Swap شبیه‌سازی |
|-------|---------------------|----------------|
| **Blockchain** | ✅ روی Solana | ❌ فقط database |
| **قیمت** | 💰 بهترین از market | 📊 محاسبه ساده |
| **تأیید** | ⏱️ 5-10 ثانیه | ⚡ فوری |
| **Fee** | 💵 0.5% + network fee | 💵 0.5% (فقط نمایش) |
| **Transaction** | 🔗 قابل مشاهده در Solscan | ❌ بدون transaction |
| **موجودی** | ✅ واقعی در wallet | ❌ فقط در database |
| **توکن‌ها** | 🪙 فقط SOL input | 🪙 همه توکن‌ها |

---

## 🎓 نکات حرفه‌ای

### 1. 💰 صرفه‌جویی در Fee
```
✅ Swap مقادیر بزرگ‌تر (fee نسبی کمتر است)
✅ از low priority fee در زمان‌های کم traffic استفاده کنید
✅ برنامه‌ریزی swap ها در ساعات خلوت شبکه
```

### 2. 🎯 بهترین قیمت
```
✅ Jupiter همیشه بهترین مسیر را پیدا می‌کند
✅ قیمت‌ها real-time هستند
✅ می‌توانید با DEX های دیگر مقایسه کنید
```

### 3. ⚠️ مدیریت ریسک
```
✅ Price impact را همیشه بررسی کنید
✅ از slippage زیاد خودداری کنید
✅ در swap های بزرگ احتیاط کنید
```

### 4. 📈 تاریخچه
```
✅ تمام swap های Jupiter در Activity ذخیره می‌شوند
✅ Signature تراکنش قابل مشاهده است
✅ می‌توانید در Solscan بررسی کنید
```

---

## 🔮 آینده

### در حال توسعه:
```
🚧 پشتیبانی از USDC, USDT به عنوان input
🚧 Limit orders (خرید/فروش با قیمت مشخص)
🚧 DCA (Dollar Cost Averaging) برای خرید دوره‌ای
🚧 Advanced routing options
🚧 Portfolio rebalancing
```

---

## 📞 پشتیبانی

### مشکل فنی دارید؟
1. Transaction signature را کپی کنید
2. در Solscan.io جستجو کنید
3. لاگ‌های console را بررسی کنید
4. با تیم پشتیبانی تماس بگیرید

### سوالات متداول:
**Q: چرا فقط SOL به عنوان input؟**
A: فاز اول! به زودی سایر توکن‌ها اضافه می‌شوند.

**Q: آیا می‌توانم swap را لغو کنم؟**
A: پس از ارسال تراکنش، امکان لغو وجود ندارد.

**Q: چرا قیمت با CoinGecko فرق می‌کند؟**
A: Jupiter قیمت واقعی از DEX ها می‌گیرد که ممکن است کمی متفاوت باشد.

**Q: آیا امن است؟**
A: بله! Jupiter یک aggregator معتبر و امن است که توسط هزاران نفر استفاده می‌شود.

---

## 🎉 خلاصه

**Saturn Wallet حالا از Jupiter Aggregator استفاده می‌کند** که بهترین DEX aggregator برای Solana است!

✅ **Swap های واقعی on-chain**
✅ **بهترین قیمت از market**
✅ **امن و سریع**
✅ **رابط کاربری ساده و زیبا**

**شروع کنید: Swap → انتخاب SOL → انتخاب توکن → 🪐 Swap on Jupiter** 🚀

---

**ساخته شده با ❤️ برای Saturn Wallet**
**Powered by 🪐 Jupiter Aggregator**
