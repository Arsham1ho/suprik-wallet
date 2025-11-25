# ⚡ راهنمای سریع تنظیم Environment Variables

## 🎉 خبر خوب: نصفش آماده است!

من فایل‌های زیر را برای شما ساخته‌ام:

- ✅ `.gitignore` → برای امنیت
- ✅ `.env.example` → الگو و راهنما
- ✅ `.env.local` → فایل محلی شما (نیمه آماده!)

---

## 🚀 فقط 2 قدم تا آماده شدن!

### قدم 1️⃣: دریافت 2 کلید از Supabase (2 دقیقه)

1. به این لینک بروید:
   ```
   https://supabase.com/dashboard/project/qagsgxsaxspomcysaesa/settings/api
   ```

2. **SERVICE_ROLE_KEY** را کپی کنید:
   - در قسمت "Project API keys"
   - کلید **service_role** (خط دوم)
   - روی آیکون 📋 کلیک کنید

3. به این لینک بروید:
   ```
   https://supabase.com/dashboard/project/qagsgxsaxspomcysaesa/settings/database
   ```

4. **DB_URL** را کپی کنید:
   - در قسمت "Connection string"
   - تب **URI** را انتخاب کنید
   - روی آیکون 📋 کلیک کنید
   - پسورد را جایگزین کنید (اگر نمی‌دانید، "Reset Database Password" بزنید)

---

### قدم 2️⃣: جایگزینی در `.env.local`

فایل `/.env.local` را باز کنید و **فقط این 2 خط** را جایگزین کنید:

```bash
# این خط را پیدا کنید:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_KEY_HERE

# کلید service_role که از Supabase کپی کردید را جایگزین کنید
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (کلید واقعی شما)
```

```bash
# این خط را پیدا کنید:
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.qagsgxsaxspomcysaesa.supabase.co:5432/postgres

# YOUR_PASSWORD را با پسورد database خود جایگزین کنید
SUPABASE_DB_URL=postgresql://postgres:your-actual-password@db.qagsgxsaxspomcysaesa.supabase.co:5432/postgres
```

---

## ✅ آزمایش کنید!

```bash
npm run dev
```

اگر اپ باز شد، آماده هستید! 🎉

---

## 🌐 Deploy به Vercel

وقتی آماده deploy هستید، این Environment Variables را در Vercel اضافه کنید:

### اجباری:
```
VITE_SUPABASE_URL=https://qagsgxsaxspomcysaesa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ3NneHNheHNwb21jeXNhZXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTEzMTIsImV4cCI6MjA3NzYyNzMxMn0.nXIq2kt816zG1yTPfG-FPDPubnPZ2n5tpQ7MFAB6sVM
SUPABASE_SERVICE_ROLE_KEY=(همان کلیدی که در .env.local گذاشتید)
SUPABASE_DB_URL=(همان URL که در .env.local گذاشتید)
```

### اختیاری (می‌توانید بعداً اضافه کنید):
```
VITE_HELIUS_API_KEY=your-key
VITE_ALCHEMY_API_KEY=your-key
APP_FEE_WALLET=your-wallet
RESEND_API_KEY=your-key
```

---

## ❓ سوالات متداول

**Q: آیا باید همه API keys را الان بگیرم؟**  
A: خیر! فقط Supabase (4 تا) اجباری است. بقیه اختیاری هستند.

**Q: Helius و Alchemy چی هستند؟**  
A: برای blockchain APIs. اگر نداشته باشید، فقط کندتر کار می‌کند.

**Q: چطور بفهمم کار می‌کند؟**  
A: `npm run dev` بزنید. اگر error نداشت، کار می‌کند!

**Q: فایل .env.local را commit کنم؟**  
A: ❌ خیر! این در .gitignore است و امن است.

---

## 🎯 چک‌لیست

- [ ] SERVICE_ROLE_KEY از Supabase گرفته شد
- [ ] DB_URL با پسورد صحیح تنظیم شد
- [ ] `.env.local` ذخیره شد
- [ ] `npm run dev` اجرا شد و کار کرد
- [ ] آماده deploy به Vercel!

---

**موفق باشید! 🚀**

اگر مشکلی داشتید، فایل `/ENV_SETUP_GUIDE.md` را ببینید.
