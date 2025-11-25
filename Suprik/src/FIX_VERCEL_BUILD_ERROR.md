# 🔧 راهنمای Fix خطای Build در Vercel

## 🔴 خطای شما:

```
sh: line 1: vite: command not found
Error: Command "vite build" exited with 127
```

---

## ✅ راه حل: 3 گام ساده

---

## گام 1️⃣: حذف و Import مجدد پروژه

خطا به این دلیل است که Vercel cache قدیمی دارد یا repository قدیمی است.

### روش A: حذف و ایجاد مجدد (سریع‌ترین)

```
1. به Vercel Dashboard بروید:
   https://vercel.com/dashboard

2. پروژه خود را پیدا کنید

3. Settings (تنظیمات) → کلیک کنید

4. پایین صفحه: "Delete Project" → کلیک کنید

5. نام پروژه را تایپ کنید و Delete کنید

6. حالا دوباره:
   Dashboard → "Add New..." → "Project"
   
7. Repository خود را Import کنید
```

### روش B: Clear Cache (اگر نمی‌خواهید delete کنید)

```
1. Vercel Dashboard → پروژه خود

2. Settings → General

3. "Clear Cache" یا "Invalidate Cache" بزنید

4. بعد Deployments → Redeploy
```

---

## گام 2️⃣: تنظیمات Build را چک کنید

وقتی دوباره Import می‌کنید یا Settings را باز می‌کنید:

### Build & Development Settings:

```
Framework Preset:
☑ Vite

Build Command:
npm run build

Output Directory:
dist

Install Command:
npm install

Root Directory:
./   (خالی بگذارید یا ./)
```

**مهم:** مطمئن شوید Root Directory درست است!

---

## گام 3️⃣: Environment Variables

**این بسیار مهم است!** بدون این‌ها اپ کار نمی‌کند:

### متغیرهای اجباری:

#### 1. VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://qagsgxsaxspomcysaesa.supabase.co
Environments: ☑ Production ☑ Preview ☑ Development
```

#### 2. VITE_SUPABASE_ANON_KEY
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ3NneHNheHNwb21jeXNhZXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTEzMTIsImV4cCI6MjA3NzYyNzMxMn0.nXIq2kt816zG1yTPfG-FPDPubnPZ2n5tpQ7MFAB6sVM
Environments: ☑ Production ☑ Preview ☑ Development
```

#### 3. SUPABASE_SERVICE_ROLE_KEY
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [باید از Supabase بگیرید]

چطور بگیرم؟
1. به https://supabase.com/dashboard/project/qagsgxsaxspomcysaesa بروید
2. Settings → API
3. "service_role" key را کپی کنید

Environments: ☑ Production ☑ Preview ☑ Development
```

#### 4. SUPABASE_DB_URL
```
Name: SUPABASE_DB_URL
Value: [باید از Supabase بگیرید]

چطور بگیرم؟
1. همان Dashboard: Settings → Database
2. Connection string → URI را انتخاب کنید
3. کپی کنید (شبیه: postgresql://postgres:PASSWORD@db...)

Environments: ☑ Production ☑ Preview ☑ Development
```

---

## 🎯 چک‌لیست قبل از Deploy:

```
☐ پروژه را Delete کردم (یا Cache را Clear کردم)
☐ دوباره Import کردم
☐ Framework Preset = Vite
☐ Build Command = npm run build
☐ Output Directory = dist
☐ Root Directory = ./ (یا خالی)
☐ 4 Environment Variable اضافه شد
☐ هر متغیر برای 3 environment تیک خورد
☐ دکمه Deploy زدم
```

---

## 🔍 بررسی Build Log

وقتی Deploy می‌کنید، به Build log نگاه کنید:

### ✅ Build موفق:

```
[12:34:56.789] Running "npm install"
[12:34:58.123] added 1250 packages
[12:34:59.456] Running "npm run build"
[12:35:01.789] vite v6.0.3 building for production...
[12:35:42.123] ✓ 1250 modules transformed
[12:35:43.456] ✓ built in 42.5s
[12:35:44.789] Build Completed
```

### ❌ اگر همچنان خطا می‌دهد:

```
[12:34:56.789] sh: line 1: vite: command not found
```

**یعنی:**
- npm install درست اجرا نشد
- package.json در root نیست
- Root Directory اشتباه است

---

## 🆘 Troubleshooting: اگر هنوز کار نکرد

### مشکل 1: "vite: command not found" هنوز وجود دارد

**راه حل:**

```
1. GitHub repository خود را باز کنید

2. چک کنید این فایل‌ها در root هستند:
   ✅ package.json
   ✅ vite.config.ts
   ✅ tsconfig.json
   ✅ index.html
   ✅ main.tsx
   ✅ vercel.json

3. اگر نیستند، push کنید:
   git add .
   git commit -m "Add build config files"
   git push origin main

4. در Vercel → Settings → General
   "Redeploy" را بزنید
```

### مشکل 2: Build موفق اما صفحه سفید

**علت:** Environment Variables نیست

**راه حل:**

```
1. Vercel → Settings → Environment Variables

2. چک کنید 4 متغیر وجود دارد

3. اگر نه، اضافه کنید (گام 3 بالا)

4. Deployments → ... → Redeploy
```

### مشکل 3: "Cannot find module '@/...'"

**راه حل:**

این fix شده است در `tsconfig.json` و `vite.config.ts`!

اگر هنوز خطا می‌دهد:

```
1. چک کنید این فایل‌ها در repository شما هستند

2. محتوای tsconfig.json باید داشته باشد:
   "paths": {
     "@/*": ["./*"]
   }

3. محتوای vite.config.ts باید داشته باشد:
   alias: {
     '@': path.resolve(__dirname, './'),
   }
```

### مشکل 4: "Failed to resolve entry for package"

**راه حل:**

```
این به دلیل conflict در dependencies است.

در Vercel:
Settings → Environment Variables → Add:

Name: NPM_FLAGS
Value: --legacy-peer-deps

Redeploy
```

---

## 📱 تست نهایی بعد از Deploy

وقتی Build موفق شد:

```
1. لینک Vercel را باز کنید
   (مثلاً: https://suprik-wallet-xxx.vercel.app)

2. چک کنید:
   ✅ صفحه باز می‌شود (نه صفحه سفید!)
   ✅ لوگو Suprik نمایش داده می‌شود
   ✅ دکمه "Get Started" کار می‌کند
   ✅ صفحه ثبت‌نام باز می‌شود

3. اگر همه کار کرد:
   🎉 موفق! Deploy شد!

4. اگر صفحه سفید:
   ⚠️ Environment Variables را چک کنید
```

---

## 🎬 مراحل سریع (TL;DR)

```bash
# 1. فایل‌ها را commit کنید
git add .
git commit -m "Fix Vercel build configuration"
git push origin main

# 2. در Vercel:
- Delete Project (یا Clear Cache)
- Add New Project → Import repository
- Framework: Vite
- Build: npm run build
- Output: dist

# 3. Environment Variables اضافه کنید (4 تا)

# 4. Deploy!
```

---

## 📋 فایل‌هایی که من ساختم:

| فایل | وضعیت | هدف |
|------|-------|------|
| `/package.json` | ✅ | Dependencies |
| `/vite.config.ts` | ✅ | Vite settings |
| `/tsconfig.json` | ✅ | TypeScript |
| `/index.html` | ✅ | HTML entry |
| `/main.tsx` | ✅ | App entry |
| `/vercel.json` | ✅ | Vercel config |
| `/.gitignore` | ✅ | Git ignore |
| `/postcss.config.js` | ✅ | PostCSS |
| `/tailwind.config.js` | ✅ | Tailwind |

**همه آماده است!** فقط باید Push و Redeploy کنید.

---

## 🔗 لینک‌های مفید:

| چیز | لینک |
|-----|------|
| 🟣 Vercel Dashboard | https://vercel.com/dashboard |
| 🟢 Supabase Dashboard | https://supabase.com/dashboard |
| 📘 راهنمای Environment Variables | `/VERCEL_ENV_VARIABLES.md` |
| 📄 کپی سریع Env Vars | `/ENV_COPY_PASTE.txt` |

---

## ✅ آماده Deploy!

**مراحل نهایی:**

```
1. ✅ این فایل را خواندید
2. ✅ Git push کنید (اگر هنوز نکردید)
3. ✅ در Vercel: Delete و Import مجدد
4. ✅ Environment Variables اضافه کنید
5. ✅ Deploy بزنید!
```

---

## 💬 به من بگویید:

وقتی این کارها را کردید، به من بگویید:

- ✅ **"Build موفق شد!"** → عالی! الان تست کنیم
- ❌ **"همچنان خطا می‌دهد: [خطا]"** → Log کامل را بفرستید
- ❓ **"گیر کردم در گام X"** → دقیقاً کمک می‌کنم

**آماده کمک هستم! 🚀**
