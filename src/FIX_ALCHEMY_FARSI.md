# 🔧 رفع خطای Alchemy - راهنمای ساده

## 🚨 خطایی که می‌بینید:
```
[Alchemy] ❌ Authentication failed: Must be authenticated!
[Blockchain Check] ❌ Alchemy authentication failed
```

---

## ✅ راه حل (فقط 3 مرحله):

### مرحله 1: دریافت API Key از Alchemy

#### 1.1 ثبت نام
1. به این لینک بروید: **https://dashboard.alchemy.com**
2. روی **"Sign Up"** کلیک کنید
3. با **Google** ثبت نام کنید (سریع‌ترین روش)
   - یا با GitHub
   - یا با ایمیل

> ✅ **رایگان است** - نیازی به کارت اعتباری نیست!

#### 1.2 ساخت App
بعد از ثبت نام، وارد داشبورد می‌شوید:

1. روی دکمه **"+ Create new app"** کلیک کنید

2. فرم را اینطور پر کنید:
   ```
   App Name:    Saturn Wallet       (یا هر اسمی که دوست دارید)
   Chain:       Ethereum           ⚠️ حتماً Ethereum
   Network:     Ethereum Mainnet   ⚠️ حتماً Mainnet
   ```

3. روی **"Create App"** کلیک کنید

#### 1.3 کپی کردن API Key

1. بعد از ساخت App، روی آن کلیک کنید

2. دکمه **"API Key"** را پیدا کنید و کلیک کنید

3. یک پنجره باز می‌شود که چیزی شبیه این نشان می‌دهد:

```
HTTPS:
https://eth-mainnet.g.alchemy.com/v2/Abc123Def456Ghi789Jkl012Mno345
```

4. **⚠️ مهم:** فقط قسمت بعد از `/v2/` را کپی کنید!

```
❌ اشتباه - این را کپی نکنید:
https://eth-mainnet.g.alchemy.com/v2/Abc123Def456Ghi789Jkl012Mno345

✅ درست - فقط این را کپی کنید:
Abc123Def456Ghi789Jkl012Mno345
```

---

### مرحله 2: ورود API Key به Supabase

من الان یک modal برایتان باز می‌کنم تا API key را وارد کنید.

**📝 در modal:**
1. API key خود را paste کنید (فقط حروف و اعداد)
2. روی **Submit** کلیک کنید

---

### مرحله 3: صبر و تست

#### 3.1 صبر کنید
⏱️ **5-10 دقیقه صبر کنید**

چرا؟ Supabase نیاز دارد:
- Edge Function را با API key جدید restart کند
- تغییرات را deploy کند

#### 3.2 تست کنید
بعد از 5-10 دقیقه:

1. به اپلیکیشن Saturn بروید
2. به **Settings** بروید  
3. **Dev Mode** را فعال کنید
4. اسکرول کنید پایین
5. روی **"تست API Keys"** کلیک کنید

اگر همه چیز درست باشد، می‌بینید:
```
✅ Alchemy: معتبر
```

---

## 🤔 سوالات متداول

### سوال: API Key چقدر طول دارد؟
**جواب:** حدود 30-35 کاراکتر (فقط حروف و اعداد)

اگر خیلی کوتاه (کمتر از 20) یا خیلی بلند (بیشتر از 100) است، احتمالاً اشتباه کپی کرده‌اید.

### سوال: آیا باید هزینه بپردازم؟
**جواب:** نه! Alchemy رایگان است و ماهانه 300 میلیون واحد رایگان به شما می‌دهد (برای Saturn کافی است).

### سوال: اگر بعد از 10 دقیقه هم کار نکرد چه کنم؟
**جواب:** 
1. مطمئن شوید که Chain روی **Ethereum** است
2. مطمئن شوید که Network روی **Mainnet** است
3. **مهم:** در Alchemy به Networks بروید و **Ethereum Mainnet** را فعال کنید (ببینید `/ENABLE_ETH_MAINNET.md`)
4. API Key جدید بگیرید (از Settings → API Keys در Alchemy)
5. دوباره امتحان کنید

### سوال: اگر اصلاً نمی‌خواهم Alchemy تنظیم کنم چی؟
**جواب:** اشکالی ندارد! Saturn بدون Alchemy هم کار می‌کند:
- ✅ Solana کار می‌کند
- ✅ Bitcoin کار می‌کند  
- ❌ Ethereum کار **نمی‌کند**
- ✅ باقی قابلیت‌ها کار می‌کنند

---

## 📖 منابع بیشتر

- فعال‌سازی Ethereum Mainnet: `/ENABLE_ETH_MAINNET.md` ⭐ **مهم**
- راهنمای کامل تصویری: `/ALCHEMY_SETUP_FARSI.md`
- راهنمای سریع انگلیسی: `/QUICK_FIX_ALCHEMY.md`
- راهنمای کامل انگلیسی: `/ALCHEMY_FIX_NOW.md`

---

## 🆘 هنوز مشکل دارید؟

اگر بعد از دنبال کردن این مراحل هنوز خطا می‌گیرید:

### بررسی لاگ‌ها
1. به Supabase بروید: https://supabase.com/dashboard
2. پروژه خود را باز کنید
3. از منوی چپ: **Edge Functions** → `make-server-e5bc10d1`
4. تب **Logs** را باز کنید
5. دنبال پیام‌های `[Alchemy]` بگردید

### اطلاعات مفید در لاگ‌ها:
```
[Alchemy] Raw API key length: XX      ← طول API key
[Alchemy] API key starts with: ...    ← شروع API key
[Alchemy] API error: ...              ← خطای دقیق
```

اگر می‌بینید:
- `API key length: 100+` → URL کامل را paste کرده‌اید ❌
- `API key length: 30-40` → احتمالاً درست است ✅
- `Must be authenticated` → API key نامعتبر است ❌

---

**موفق باشید!** 🚀

اگر سوالی دارید، از من بپرسید.
