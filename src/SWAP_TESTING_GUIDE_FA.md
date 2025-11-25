# 🧪 راهنمای تست Real Swap در Saturn

## تست سریع (5 دقیقه)

### قدم 1: بررسی وضعیت Backend Proxy

باز کردن Console مرورگر (F12) و اجرای:

```javascript
// تست Jupiter Quote Proxy
fetch('https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-e5bc10d1/jupiter/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1000000000&slippageBps=100', {
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY'
  }
})
.then(r => r.json())
.then(d => console.log('✅ Quote:', d))
.catch(e => console.error('❌ Error:', e));
```

اگر quote دریافت کردید ✅ = backend proxy کار می‌کند!

### قدم 2: تست Swap در Testnet Mode

1. به Settings → Network → **Testnet Mode** بروید
2. به صفحه Swap بروید
3. SOL → USDC را انتخاب کنید
4. مبلغ 0.1 SOL را وارد کنید
5. روی "Swap" کلیک کنید

**نتیجه مورد انتظار:**
- ✅ Quote در عرض 1-2 ثانیه نمایش داده می‌شود
- ✅ پیام "Testnet mode: Simulating swap" در console
- ✅ Swap بدون خطا تکمیل می‌شود
- ✅ Success dialog نمایش داده می‌شود
- ✅ Balance به‌روز می‌شود (محلی)

### قدم 3: تست Swap در Mainnet Mode

**⚠️ توجه:** در mainnet، swap‌های واقعی انجام می‌شود و هزینه دارند!

1. مطمئن شوید که حداقل 0.1 SOL دارید (برای تست + fees)
2. به Settings → Network → **Mainnet** بروید
3. به صفحه Swap بروید
4. SOL → USDC را انتخاب کنید (یا هر جفت دیگری)
5. مبلغ کمی وارد کنید (مثلاً 0.01 SOL)

**نتیجه مورد انتظار:**
- ✅ Quote واقعی از Jupiter در عرض 2-5 ثانیه
- ✅ Price impact و route نمایش داده می‌شود
- ✅ پس از کلیک روی "Swap":
  - پیام "MAINNET MODE: Using real Jupiter Swap" در console
  - Signing transaction...
  - Broadcasting transaction...
  - Transaction confirmed!
- ✅ **Signature واقعی** transaction در Solana blockchain
- ✅ Balance واقعی به‌روز می‌شود

### قدم 4: بررسی Transaction در Blockchain Explorer

1. پس از swap موفق، signature را کپی کنید
2. به https://solscan.io بروید
3. signature را paste کنید و search کنید
4. باید transaction واقعی را ببینید! 🎉

## تست‌های پیشرفته

### تست 1: Fallback Mechanism

```javascript
// در Console مرورگر، مشاهده کنید که چگونه از proxy به direct و سپس به mock می‌رود
```

Logs مورد انتظار:
```
[Jupiter] Attempting to fetch quote through backend proxy...
[Jupiter] Proxy method failed: ...
[Jupiter] Attempting direct API call...
[Jupiter] Direct API call failed: ...
[Jupiter] ⚠️ Jupiter API blocked (likely CORS/iframe restriction)
[Jupiter] 💡 Falling back to mock quote
```

### تست 2: مقایسه با Phantom

انجام یک swap مشابه در هر دو:
- Saturn: SOL → USDC
- Phantom: SOL → USDC

مقایسه کنید:
- ✅ Quote مشابه است؟
- ✅ Price impact مشابه است؟
- ✅ Route مشابه است؟
- ✅ سرعت مشابه است؟

### تست 3: توکن‌های مختلف

تست swap برای:
- ✅ SOL → USDC
- ✅ USDC → SOL
- ✅ SOL → USDT
- ✅ USDC → USDT
- ✅ سایر جفت‌های محبوب

### تست 4: خطاها

تست موارد خاص:
- ❌ مبلغ بیشتر از balance
- ❌ token نامعتبر
- ❌ مبلغ منفی یا صفر
- ❌ slippage خیلی کم (swap ممکن است fail شود)

## چک‌لیست تست کامل

### Backend
- [ ] Jupiter Quote Proxy کار می‌کند
- [ ] Jupiter Swap Proxy کار می‌کند
- [ ] خطاها به درستی handle می‌شوند
- [ ] Timeouts به درستی کار می‌کنند

### Frontend - Testnet
- [ ] Quote در testnet mode کار می‌کند
- [ ] Swap simulation بدون خطا تکمیل می‌شود
- [ ] Balance محلی به‌روز می‌شود
- [ ] Success dialog نمایش داده می‌شود

### Frontend - Mainnet
- [ ] Quote واقعی از Jupiter دریافت می‌شود
- [ ] Price impact و route نمایش داده می‌شود
- [ ] Transaction signing کار می‌کند
- [ ] Transaction به blockchain ارسال می‌شود
- [ ] Confirmation دریافت می‌شود
- [ ] Signature واقعی نمایش داده می‌شود
- [ ] Balance واقعی به‌روز می‌شود

### UX
- [ ] Loading states به درستی نمایش داده می‌شوند
- [ ] خطاها به کاربر نمایش داده می‌شوند
- [ ] Success animation پخش می‌شود
- [ ] Sound effect پخش می‌شود
- [ ] Haptic feedback کار می‌کند (در موبایل)

## خطاهای رایج و راه‌حل‌ها

### ❌ "Proxy error: 500"
**علت:** Backend در حال راه‌اندازی است یا خطای داخلی دارد

**راه‌حل:**
1. چند ثانیه صبر کنید و دوباره تلاش کنید
2. Logs backend را در Supabase Dashboard بررسی کنید
3. اگر ادامه داشت، از Testnet mode استفاده کنید

### ❌ "Failed to fetch"
**علت:** محدودیت CORS یا network

**راه‌حل:**
- سیستم خودکار به mock mode می‌رود
- برای swap واقعی، از Testnet mode استفاده نکنید

### ❌ "Insufficient balance"
**علت:** موجودی کافی نیست

**راه‌حل:**
- حداقل 0.01 SOL بیشتر از مبلغ swap داشته باشید (برای fees)
- در Solana همیشه حداقل 0.01 SOL برای rent نیاز است

### ❌ "Transaction failed"
**علت:** ممکن است price impact زیاد باشد یا slippage کافی نباشد

**راه‌حل:**
1. Slippage را افزایش دهید (Settings → Slippage → 1% یا بیشتر)
2. مبلغ کمتری swap کنید
3. دوباره تلاش کنید (قیمت‌ها تغییر می‌کنند)

## نتیجه‌گیری

اگر تمام تست‌های بالا را با موفقیت پشت سر گذاشتید:

# 🎉 تبریک! Swap به صورت کامل کار می‌کند! 🎉

Saturn حالا یک DEX aggregator واقعی است که از Jupiter استفاده می‌کند، دقیقاً مانند Phantom!

---

**نکته:** همیشه با مبالغ کم شروع کنید تا از صحت عملکرد مطمئن شوید.
