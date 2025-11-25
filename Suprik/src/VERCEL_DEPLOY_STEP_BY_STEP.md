# 🚀 راهنمای گام به گام Deploy به Vercel

## پیش‌نیاز: مقادیر Environment Variables شما

قبل از شروع، این مقادیر را از فایل `.env.local` خود کپی کنید:

```
✅ VITE_SUPABASE_URL=https://qagsgxsaxspomcysaesa.supabase.co
✅ VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ3NneHNheHNwb21jeXNhZXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTEzMTIsImV4cCI6MjA3NzYyNzMxMn0.nXIq2kt816zG1yTPfG-FPDPubnPZ2n5tpQ7MFAB6sVM
⚠️ SUPABASE_SERVICE_ROLE_KEY=(مقدار واقعی از .env.local)
⚠️ SUPABASE_DB_URL=(مقدار واقعی از .env.local)
🔵 VITE_HELIUS_API_KEY=(اگر دارید)
🔵 VITE_ALCHEMY_API_KEY=(اگر دارید)
🔵 APP_FEE_WALLET=(اگر دارید)
🔵 RESEND_API_KEY=(اگر دارید)
```

---

## مرحله 1️⃣: بررسی فایل‌های پروژه

### چک کنید که .env.local در Git نیست:

```bash
git status
```

**باید ببینید:**
```
On branch main
Changes not staged for commit:
  modified:   .env.example
  modified:   .gitignore
  
Untracked files:
  ENV_SETUP_GUIDE.md
  QUICK_ENV_SETUP_FA.md
  VERCEL_DEPLOY_STEP_BY_STEP.md
```

**نباید ببینید:**
```
❌ .env.local
```

✅ اگر `.env.local` نبود، عالی! ادامه دهید.

---

## مرحله 2️⃣: Commit و Push (اگر از Git استفاده می‌کنید)

### اگر پروژه را در GitHub دارید:

```bash
# اضافه کردن فایل‌های جدید
git add .gitignore .env.example ENV_SETUP_GUIDE.md QUICK_ENV_SETUP_FA.md

# Commit
git commit -m "Add environment setup files and security"

# Push
git push origin main
```

### اگر پروژه را در GitHub ندارید:

**گزینه A: ساخت GitHub Repository:**
1. به https://github.com/new بروید
2. نام repository: `suprik-wallet`
3. **Private** را انتخاب کنید (مهم!)
4. "Create repository" بزنید
5. دستورات زیر را اجرا کنید:

```bash
git init
git add .
git commit -m "Initial commit - Suprik Wallet"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/suprik-wallet.git
git push -u origin main
```

**گزینه B: Deploy مستقیم از Figma Make:**
- این ساده‌تر است، ادامه دهید به مرحله 3

---

## مرحله 3️⃣: ورود به Vercel

1. به https://vercel.com بروید
2. **"Sign Up"** یا **"Log In"** کلیک کنید
3. گزینه **"Continue with GitHub"** را انتخاب کنید
4. اجازه دسترسی به GitHub را بدهید

---

## مرحله 4️⃣: Import پروژه

### روش A: از GitHub

1. در Vercel، **"Add New..."** → **"Project"** کلیک کنید
2. **"Import Git Repository"** را انتخاب کنید
3. Repository `suprik-wallet` را پیدا کنید
4. **"Import"** بزنید

### روش B: از Figma Make

1. در Figma Make، دکمه **"Deploy"** را بزنید
2. **"Deploy to Vercel"** را انتخاب کنید
3. صبر کنید تا به صفحه Vercel برود

---

## مرحله 5️⃣: تنظیم Environment Variables (مهم‌ترین مرحله!)

### در صفحه Configure Project:

1. **Project Name** را بنویسید: `suprik-wallet`
2. **Framework Preset**: Vite را انتخاب کنید (یا auto-detect)
3. قسمت **"Environment Variables"** را باز کنید

### اضافه کردن متغیرها:

#### متغیر 1: VITE_SUPABASE_URL
```
┌─────────────────────────────────────────────────┐
│ Key (Name):                                     │
│ VITE_SUPABASE_URL                               │
│                                                 │
│ Value:                                          │
│ https://qagsgxsaxspomcysaesa.supabase.co       │
│                                                 │
│ Environment:                                    │
│ ☑ Production  ☑ Preview  ☑ Development         │
└─────────────────────────────────────────────────┘
```
دکمه **"Add"** بزنید

#### متغیر 2: VITE_SUPABASE_ANON_KEY
```
┌─────────────────────────────────────────────────┐
│ Key (Name):                                     │
│ VITE_SUPABASE_ANON_KEY                          │
│                                                 │
│ Value:                                          │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M... │
│ (کل کلید را کپی کنید)                         │
│                                                 │
│ Environment:                                    │
│ ☑ Production  ☑ Preview  ☑ Development         │
└─────────────────────────────────────────────────┘
```
دکمه **"Add"** بزنید

#### متغیر 3: SUPABASE_SERVICE_ROLE_KEY
```
┌─────────────────────────────────────────────────┐
│ Key (Name):                                     │
│ SUPABASE_SERVICE_ROLE_KEY                       │
│                                                 │
│ Value:                                          │
│ (از .env.local خود کپی کنید)                  │
│                                                 │
│ Environment:                                    │
│ ☑ Production  ☑ Preview  ☑ Development         │
└─────────────────────────────────────────────────┘
```
⚠️ **این کلید را حتماً از `.env.local` خود کپی کنید!**

دکمه **"Add"** بزنید

#### متغیر 4: SUPABASE_DB_URL
```
┌─────────────────────────────────────────────────┐
│ Key (Name):                                     │
│ SUPABASE_DB_URL                                 │
│                                                 │
│ Value:                                          │
│ postgresql://postgres:YOUR_PASSWORD@db...       │
│ (از .env.local خود کپی کنید)                  │
│                                                 │
│ Environment:                                    │
│ ☑ Production  ☑ Preview  ☑ Development         │
└─────────────────────────────────────────────────┘
```
⚠️ **مطمئن شوید پسورد صحیح است!**

دکمه **"Add"** بزنید

---

### متغیرهای اختیاری (می‌توانید بعداً اضافه کنید):

#### VITE_HELIUS_API_KEY (برای Solana)
```
Key: VITE_HELIUS_API_KEY
Value: (کلید از Helius)
Environment: ☑ همه
```

#### VITE_ALCHEMY_API_KEY (برای Ethereum)
```
Key: VITE_ALCHEMY_API_KEY
Value: (کلید از Alchemy)
Environment: ☑ همه
```

#### APP_FEE_WALLET (برای کارمزد)
```
Key: APP_FEE_WALLET
Value: (آدرس Solana wallet)
Environment: ☑ همه
```

#### RESEND_API_KEY (برای ایمیل)
```
Key: RESEND_API_KEY
Value: (کلید از Resend)
Environment: ☑ همه
```

---

## مرحله 6️⃣: Deploy!

1. بعد از اضافه کردن Environment Variables
2. دکمه **"Deploy"** را بزنید
3. صبر کنید (2-5 دقیقه)

### در حین Build:

شما یک صفحه با logs خواهید دید:
```
Building...
▲ Vercel
Installing dependencies...
✓ Dependencies installed
Building application...
✓ Build completed
Deploying...
```

---

## مرحله 7️⃣: بررسی Deployment

### اگر موفق بود:

```
✓ Deployment Ready!

🎉 Your project is live at:
https://suprik-wallet-xxx.vercel.app
```

دکمه **"Visit"** را بزنید و اپ خود را ببینید!

---

### اگر خطا داد:

**خطای رایج 1: "Environment variable not found"**
```
❌ راه حل:
1. به Vercel Dashboard بروید
2. Settings → Environment Variables
3. متغیرهای گمشده را اضافه کنید
4. Deployments → ... → "Redeploy"
```

**خطای رایج 2: "Build failed"**
```
❌ راه حل:
1. Log ها را بخوانید
2. معمولاً مشکل از dependency است
3. در Figma Make به من بگویید تا fix کنم
```

**خطای رایج 3: "Supabase connection failed"**
```
❌ راه حل:
1. چک کنید SUPABASE_URL درست است
2. چک کنید SUPABASE_ANON_KEY درست است
3. چک کنید Supabase project فعال است
```

---

## مرحله 8️⃣: تنظیمات بعد از Deploy

### A. Custom Domain (اختیاری)

1. در Vercel: **Settings** → **Domains**
2. دامنه خود را اضافه کنید (مثلاً `suprik.com`)
3. DNS records را در domain provider خود تنظیم کنید

### B. اضافه کردن API Keys بعدی

اگر بعداً خواستید Helius یا Alchemy اضافه کنید:

1. **Settings** → **Environment Variables**
2. **"Add New"** بزنید
3. Key و Value را وارد کنید
4. **"Save"** بزنید
5. به **Deployments** بروید
6. آخرین deployment را پیدا کنید
7. **"..."** → **"Redeploy"** بزنید

---

## 🎉 تبریک! شما Deploy کردید!

### چک‌لیست نهایی:

- [ ] اپ live است و باز می‌شود
- [ ] می‌توانید ثبت‌نام کنید
- [ ] کیف پول ساخته می‌شود
- [ ] موجودی نمایش داده می‌شود
- [ ] تراکنش می‌توانید ارسال کنید

---

## 📊 URLs مهم:

### Vercel Dashboard:
```
https://vercel.com/dashboard
```

### Production URL شما:
```
https://suprik-wallet-xxx.vercel.app
```

### Supabase Dashboard:
```
https://supabase.com/dashboard/project/qagsgxsaxspomcysaesa
```

---

## 🔄 به‌روزرسانی اپ

هر بار که تغییری می‌دهید:

```bash
git add .
git commit -m "توضیحات تغییرات"
git push
```

Vercel خودکار دوباره deploy می‌کند! ✨

---

## 🆘 کمک بیشتر

اگر مشکلی داشتید:

1. **Error Logs**: در Vercel Dashboard → Deployments → آخرین build → View Logs
2. **Environment Variables**: Settings → Environment Variables
3. **Redeploy**: Deployments → ... → Redeploy

---

**آماده هستید؟ بزنید Deploy! 🚀**
