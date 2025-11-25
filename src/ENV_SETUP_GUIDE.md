# 🔧 راهنمای تنظیم Environment Variables

## ✅ فایل‌های ایجاد شده

من 3 فایل برای شما ساخته‌ام:

1. **`.env.example`** → الگو و راهنما (این را می‌توانید commit کنید)
2. **`.env.local`** → فایل واقعی شما (این را commit نکنید!)
3. **`.gitignore`** → برای امنیت

---

## 📝 مرحله 1: پر کردن `.env.local`

فایل `/.env.local` را باز کنید و مقادیر زیر را جایگزین کنید:

### 🔴 اجباری (Supabase):
```bash
VITE_SUPABASE_URL=https://qagsgxsaxspomcysaesa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ3NneHNheHNwb21jeXNhZXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTEzMTIsImV4cCI6MjA3NzYyNzMxMn0.nXIq2kt816zG1yTPfG-FPDPubnPZ2n5tpQ7MFAB6sVM
```

**✅ این دو مقدار را من از کد شما گرفتم و پر کردم!**

### بقیه نیاز به دریافت دارند:

#### SUPABASE_SERVICE_ROLE_KEY:
1. به https://supabase.com/dashboard/project/qagsgxsaxspomcysaesa بروید
2. **Settings** → **API** → **Project API keys**
3. کلید **service_role** را کپی کنید

#### SUPABASE_DB_URL:
1. همان صفحه **Settings** → **Database** → **Connection string**
2. **URI** را کپی کنید
3. `[YOUR-PASSWORD]` را با پسورد database جایگزین کنید

---

### 🟡 اختیاری (Blockchain APIs):

#### VITE_HELIUS_API_KEY:
- به https://www.helius.dev بروید
- ثبت‌نام کنید (رایگان)
- "Create API Key" کلیک کنید

#### VITE_ALCHEMY_API_KEY:
- به https://www.alchemy.com بروید
- ثبت‌نام کنید (رایگان)
- "Create App" → Ethereum Mainnet
- API Key را کپی کنید

---

## 🚀 مرحله 2: Test محلی

بعد از پر کردن `.env.local`:

```bash
# نصب dependencies (اگر نکرده‌اید)
npm install

# اجرای dev server
npm run dev
```

---

## 🌐 مرحله 3: Deploy به Vercel

### گزینه A: Import از GitHub

اگر کد را به GitHub push کرده‌اید:

1. به https://vercel.com بروید
2. "New Project" → "Import Git Repository"
3. پروژه را انتخاب کنید
4. در بخش **Environment Variables** این‌ها را اضافه کنید:

```
VITE_SUPABASE_URL=https://qagsgxsaxspomcysaesa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:...
VITE_HELIUS_API_KEY=your-key-here
VITE_ALCHEMY_API_KEY=your-key-here
```

5. "Deploy" کلیک کنید!

---

### گزینه B: Deploy از Figma Make

اگر می‌خواهید مستقیماً از Figma Make deploy کنید:

1. دکمه **Deploy** را بزنید
2. در صفحه Vercel، Environment Variables را وارد کنید
3. تمام!

---

## 🔒 نکات امنیتی

### ✅ انجام دهید:
- فایل `.env.local` را commit نکنید (در `.gitignore` است)
- در Vercel از Environment Variables استفاده کنید
- `SERVICE_ROLE_KEY` را فقط در backend استفاده کنید

### ❌ انجام ندهید:
- `.env.local` را push نکنید
- کلیدها را در کد commit نکنید
- `SERVICE_ROLE_KEY` را در frontend استفاده نکنید

---

## 📋 چک‌لیست

- [ ] فایل `.env.local` پر شده است
- [ ] SUPABASE_URL و ANON_KEY تأیید شده (✅ از قبل پر شده)
- [ ] SERVICE_ROLE_KEY از Supabase گرفته شده
- [ ] DB_URL با پسورد صحیح تنظیم شده
- [ ] (اختیاری) Helius API Key
- [ ] (اختیاری) Alchemy API Key
- [ ] Test محلی انجام شده (`npm run dev`)
- [ ] Environment Variables در Vercel اضافه شده
- [ ] Deploy موفق بوده

---

## 🆘 مشکل دارید؟

### مشکل: "SUPABASE_URL not found"
**راه حل:** مطمئن شوید `VITE_` در ابتدای نام متغیر است

### مشکل: "Service Role Key invalid"
**راه حل:** کلید را دوباره از Supabase کپی کنید (بدون فاصله اضافی)

### مشکل: "Database connection failed"
**راه حل:** پسورد در `SUPABASE_DB_URL` را چک کنید

---

## 🎯 آماده هستید!

بعد از تکمیل این مراحل:
- ✅ Development محلی کار می‌کند
- ✅ آماده deploy به Vercel هستید
- ✅ همه API keys به درستی تنظیم شده‌اند

---

## 📞 مراحل بعدی:

1. `.env.local` را پر کنید
2. `npm run dev` را اجرا کنید
3. اگر همه چیز کار کرد، به Vercel deploy کنید!

موفق باشید! 🚀
