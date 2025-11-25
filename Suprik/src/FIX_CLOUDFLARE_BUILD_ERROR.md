# 🔧 Fix کردن Build Error در Cloudflare Pages

**خطا**: "Missing entry-point to Worker script"  
**علت**: Build command اشتباه است!

---

## ❌ مشکل

Cloudflare در حال اجرای `npx wrangler deploy` است که برای **Workers** است، نه **Pages**!

```
✘ [ERROR] Missing entry-point to Worker script or to assets directory
```

---

## ✅ راه حل (2 دقیقه)

### مرحله 1: برو به Cloudflare Dashboard

```
https://dash.cloudflare.com
→ Workers & Pages
→ انتخاب project "suprik-wallet"
→ Settings
```

---

### مرحله 2: Fix کردن Build Settings

در صفحه Settings:

```
1. پیدا کردن بخش "Build & deployments"
2. کلیک "Edit configuration"
```

#### تنظیمات صحیح:

```
┌─────────────────────────────────────────┐
│ Framework preset                        │
├─────────────────────────────────────────┤
│ Vite                                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Build command                           │
├─────────────────────────────────────────┤
│ npm run build                           │
│                                         │
│ ❌ نه: npx wrangler deploy              │
│ ✅ بله: npm run build                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Build output directory                  │
├─────────────────────────────────────────┤
│ dist                                    │
│                                         │
│ ⚠️ دقیقاً: dist (نه /dist)              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Root directory (optional)               │
├─────────────────────────────────────────┤
│ (leave empty)                           │
└─────────────────────────────────────────┘
```

---

### مرحله 3: Save و Retry

```
1. کلیک "Save"
2. برو به "Deployments" tab
3. کلیک "Retry deployment"
```

---

## 🎯 تنظیمات کامل

اینها را copy/paste کنید:

### Build command:
```
npm run build
```

### Build output directory:
```
dist
```

### Root directory:
```
(empty)
```

---

## 🔍 چک کنید Environment Variables

مطمئن شوید این متغیرها را اضافه کرده‌اید:

```
Settings > Environment variables

✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
✅ VITE_SUPABASE_SERVICE_ROLE_KEY
```

---

## 🚀 بعد از Fix

```
1. Save settings
2. Retry deployment
3. منتظر 2-4 دقیقه
4. ✅ Build موفق می‌شود!
```

---

## 📸 Screenshot راهنما

### قبل (اشتباه):
```
Build command: npx wrangler deploy ❌
```

### بعد (درست):
```
Build command: npm run build ✅
Build output: dist
```

---

## 🐛 اگر هنوز error دارید

### Error: "npm run build failed"

```bash
# Check local:
npm install
npm run build

# اگر موفق شد، مشکل از env variables است
```

### Error: "dist directory not found"

```
Fix: 
Build output directory = dist
نه: /dist
نه: ./dist
فقط: dist
```

---

## 💡 چرا این اتفاق افتاد؟

```
❌ Cloudflare فکر کرد شما Workers می‌خواهید
✅ شما Pages می‌خواهید (برای static sites)

Workers = Backend code (wrangler deploy)
Pages = Frontend apps (npm run build)
```

---

## ✅ Checklist بعد از Fix

```
□ Build command = npm run build
□ Build output = dist
□ Environment variables اضافه شده‌اند
□ Retry deployment زده‌ام
□ Build در حال اجراست
```

---

## 🎉 موفقیت!

بعد از fix، باید این را ببینید:

```
✅ Initializing build environment
✅ Cloning repository  
✅ Installing dependencies
✅ Running: npm run build
✅ Build successful
✅ Deploying to Cloudflare network
✅ Deployment successful!

🔗 https://suprik-wallet-xxx.pages.dev
```

---

## 🆘 نیاز به کمک بیشتر؟

### راهنماهای دیگر:

```
📖 /DEPLOY_CLOUDFLARE_COMPLETE.md - راهنمای کامل
⚡ /DEPLOY_CLOUDFLARE_QUICK.md - Quick guide
✅ /CLOUDFLARE_DEPLOY_CHECKLIST.md - Checklist
```

### Cloudflare Support:

```
🔗 Dashboard: https://dash.cloudflare.com
🔗 Docs: https://developers.cloudflare.com/pages
🔗 Community: https://community.cloudflare.com
```

---

**🔧 این یک مشکل رایج است و خیلی راحت fix می‌شود! فقط build command را درست کنید! 🚀**
