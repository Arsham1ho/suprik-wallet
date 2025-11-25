# 📸 راهنمای تصویری تنظیمات Cloudflare Pages

**برای Fix کردن Build Error** 🔧

---

## 🎯 مشکل شما

```
Error: Missing entry-point to Worker script
```

**علت**: Build command اشتباه است!

---

## 🔧 راه حل Step-by-Step

### مرحله 1: ورود به Dashboard

```
🔗 برو به: https://dash.cloudflare.com
```

پس از login:
```
1. از sidebar چپ انتخاب کنید: "Workers & Pages"
2. لیست projects را می‌بینید
3. پیدا کنید: "suprik-wallet" (یا نام project شما)
4. کلیک روی project
```

---

### مرحله 2: باز کردن Settings

```
در صفحه project:

┌─────────────────────────────────────┐
│  suprik-wallet                      │
│                                     │
│  [Overview] [Deployments] [Settings]│
│     ↑                          ↑    │
│  در Overview هستید         اینجا   │
└─────────────────────────────────────┘

کلیک روی "Settings" tab
```

---

### مرحله 3: پیدا کردن Build Configuration

```
در صفحه Settings:

┌─────────────────────────────────────┐
│ ⚙️ Settings                          │
│                                     │
│ • General                           │
│ • Build & deployments ← اینجا       │
│ • Environment variables             │
│ • Functions                         │
│ • Redirects/Headers                 │
└─────────────────────────────────────┘

کلیک روی "Build & deployments"
```

---

### مرحله 4: ویرایش Build Settings

```
در بخش "Build & deployments":

┌─────────────────────────────────────┐
│ Build configuration                 │
│                                     │
│ Production branch: main             │
│ Framework preset: Vite              │
│ Build command: [اینجا مشکل است]     │
│                                     │
│              [Edit configuration]   │
│                    ↑                │
│              کلیک اینجا              │
└─────────────────────────────────────┘
```

---

### مرحله 5: تنظیمات صحیح

وقتی "Edit configuration" را کلیک می‌کنید، این فرم باز می‌شود:

```
┌────────────────────────────────────────┐
│ Edit build configuration               │
│                                        │
│ Framework preset                       │
│ ┌────────────────────────────────────┐ │
│ │ Vite                          ▼   │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Build command                          │
│ ┌────────────────────────────────────┐ │
│ │ npm run build                     │ │ ← اینجا!
│ └────────────────────────────────────┘ │
│                                        │
│ Build output directory                 │
│ ┌────────────────────────────────────┐ │
│ │ dist                              │ │ ← و اینجا!
│ └────────────────────────────────────┘ │
│                                        │
│ Root directory (optional)              │
│ ┌────────────────────────────────────┐ │
│ │                                   │ │ ← خالی
│ └────────────────────────────────────┘ │
│                                        │
│         [Cancel]  [Save]               │
│                      ↑                 │
│               بعد کلیک اینجا           │
└────────────────────────────────────────┘
```

---

## ✅ مقادیر صحیح

### Build command:
```
npm run build
```

**❌ اشتباه:**
```
npx wrangler deploy
wrangler deploy
npm run dev
```

### Build output directory:
```
dist
```

**❌ اشتباه:**
```
/dist
./dist
build
public
```

### Root directory:
```
(leave empty)
```

---

## 🔐 بررسی Environment Variables

### مرحله 6: Check Environment Variables

```
در Settings sidebar:

┌─────────────────────────────────────┐
│ • Build & deployments               │
│ • Environment variables ← کلیک اینجا│
│ • Functions                         │
└─────────────────────────────────────┘
```

باید این‌ها را ببینید:

```
┌──────────────────────────────────────────┐
│ Environment variables                    │
│                                          │
│ Production:                              │
│                                          │
│ Name                          Value      │
│ ────────────────────────────────────     │
│ VITE_SUPABASE_URL            https://... │
│ VITE_SUPABASE_ANON_KEY       eyJhbGci...│
│ VITE_SUPABASE_SERVICE_...    eyJhbGci...│
│                                          │
│              [Add variable]              │
└──────────────────────────────────────────┘
```

**اگر این متغیرها نیستند:**

```
1. کلیک "Add variable"
2. وارد کردن Name و Value
3. کلیک "Save"
```

---

## 🚀 Retry Deployment

### مرحله 7: Redeploy

```
1. برگشت به Overview یا Deployments tab

┌─────────────────────────────────────┐
│  [Overview] [Deployments] [Settings]│
│               ↑                     │
│          کلیک اینجا                 │
└─────────────────────────────────────┘

2. در Deployments لیست می‌بینید:

┌─────────────────────────────────────┐
│ Recent deployments                  │
│                                     │
│ ❌ Failed  •  2 minutes ago         │
│    main branch                      │
│    [View details] [Retry] ← اینجا  │
└─────────────────────────────────────┘

3. کلیک "Retry deployment"
```

---

## ⏳ منتظر Build

```
بعد از Retry:

⏳ Building...

┌─────────────────────────────────────┐
│ Build in progress                   │
│                                     │
│ ⏳ Initializing...                  │
│ ⏳ Cloning repository...            │
│ ⏳ Installing dependencies...       │
│ ⏳ Building...                      │
│                                     │
│ View logs                           │
└─────────────────────────────────────┘

معمولاً 2-4 دقیقه طول می‌کشد
```

---

## ✅ موفقیت!

وقتی build موفق شد:

```
┌─────────────────────────────────────┐
│ ✅ Deployment successful             │
│                                     │
│ Your site is live at:               │
│ https://suprik-wallet-xxx.pages.dev │
│                                     │
│ [Visit site]                        │
└─────────────────────────────────────┘
```

---

## 📋 Checklist نهایی

```
□ Dashboard باز کردم
□ Project را پیدا کردم
□ Settings > Build & deployments
□ Edit configuration کردم
□ Build command = npm run build
□ Build output = dist
□ Save کردم
□ Environment variables را check کردم
□ Retry deployment زدم
□ Build موفق شد ✅
□ Site live است! 🎉
```

---

## 🎯 نکات مهم

### Build Command:
```
✅ npm run build
❌ npx wrangler deploy (این برای Workers است!)
```

### Build Output:
```
✅ dist (بدون slash)
❌ /dist
❌ ./dist
```

### Environment Variables:
```
✅ همه باید VITE_ prefix داشته باشند
✅ در Production environment تعریف شوند
```

---

## 🐛 اگر هنوز error دارید

### Check Build Logs:

```
در Deployments page:

┌─────────────────────────────────────┐
│ ❌ Failed deployment                 │
│    [View build log] ← کلیک          │
└─────────────────────────────────────┘
```

### رایج‌ترین errors:

```
❌ "npm ERR! missing script: build"
→ مطمئن شوید package.json دارای "build" script است

❌ "ENOENT: no such file or directory, scandir 'dist'"
→ Build output directory اشتباه است

❌ "VITE_SUPABASE_URL is not defined"
→ Environment variables را اضافه کنید
```

---

## 📚 منابع کمکی

```
📖 /FIX_CLOUDFLARE_BUILD_ERROR.md     - توضیحات کامل
⚡ /CLOUDFLARE_QUICK_FIX.txt          - Quick fix
✅ /CLOUDFLARE_DEPLOY_CHECKLIST.md    - Checklist
📖 /DEPLOY_CLOUDFLARE_COMPLETE.md     - راهنمای اصلی
```

---

**🎊 با دنبال کردن این مراحل، build شما موفق می‌شود! 🚀**
