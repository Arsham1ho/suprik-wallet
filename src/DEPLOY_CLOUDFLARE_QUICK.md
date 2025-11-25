# ⚡ Deploy به Cloudflare Pages - Quick Guide

**زمان**: 8 دقیقه | **هزینه**: رایگان 🆓

---

## 🚀 4 مرحله ساده

### 1️⃣ Push to Git (2 دقیقه)

```bash
git init
git add .
git commit -m "Deploy to Cloudflare Pages"
git remote add origin https://github.com/YOUR_USERNAME/suprik-wallet.git
git push -u origin main
```

---

### 2️⃣ Cloudflare Setup (2 دقیقه)

```
1. برو به: https://dash.cloudflare.com
2. Workers & Pages > Create application > Pages
3. Connect to Git > انتخاب GitHub
4. انتخاب repository "suprik-wallet"
```

---

### 3️⃣ Build Settings (2 دقیقه)

```
Framework preset:    Vite
Build command:       npm run build
Build output:        dist
Production branch:   main
```

---

### 4️⃣ Environment Variables (2 دقیقه)

**کلیک "Add variable" و اضافه کن:**

```env
VITE_SUPABASE_URL=https://qagsgxsaxspomcysaesa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**اختیاری:**
```env
VITE_ALCHEMY_API_KEY=...
VITE_HELIUS_API_KEY=...
VITE_APP_FEE_WALLET=...
```

---

### ✅ کلیک "Save and Deploy"!

```
⏳ صبر کن 2-4 دقیقه...
✅ اپ live است!
🔗 https://suprik-wallet-xxx.pages.dev
```

---

## 🎯 Checklist

```
□ Git push شد
□ Cloudflare account ساختم
□ Repository connect شد
□ Build settings درست است (dist نه /dist)
□ Environment variables اضافه شدند (با VITE_ prefix)
□ Deploy موفق بود
□ Site باز می‌شود
□ Features کار می‌کنند
```

---

## 🐛 مشکلات رایج

### Build Failed?
```
Check: Build output = dist (نه /dist)
```

### Env Variables نمی‌بینه?
```
1. مطمئن شو VITE_ prefix دارند
2. Settings > Environment variables > Check
3. Retry deployment
```

### Site باز نمی‌شه?
```
F12 > Console errors چک کن
```

---

## 🔄 Update کردن

```bash
# هر بار که push می‌کنی:
git add .
git commit -m "Update"
git push

# خودکار deploy می‌شه! ✨
```

---

## 🎉 Done!

```
✅ اپ live است
✅ Unlimited bandwidth
✅ Global CDN
✅ Auto-deploy
✅ DDoS protection
```

**آدرس**: `https://suprik-wallet-xxx.pages.dev`

---

## 📚 نیاز به جزئیات بیشتر؟

ببین: `/DEPLOY_CLOUDFLARE_COMPLETE.md`

---

**🚀 تبریک! Suprik روی Cloudflare زنده است! 🎊**
