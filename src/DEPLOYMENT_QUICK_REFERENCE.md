# ⚡ Quick Reference - Deployment Commands

یک صفحه برای copy/paste سریع! 🚀

---

## 🔧 Local Development

```bash
# نصب dependencies
npm install

# اجرا در حالت development
npm run dev

# Build برای production
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck
```

---

## 📦 Git Commands

```bash
# Initialize (اولین بار)
git init
git add .
git commit -m "Initial commit - Suprik ready for deployment"

# Push به GitHub
git remote add origin https://github.com/YOUR_USERNAME/suprik-wallet.git
git branch -M main
git push -u origin main

# Update بعدی
git add .
git commit -m "Your update message"
git push
```

---

## 🌐 Vercel CLI (Optional)

```bash
# نصب Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## 🔐 Environment Variables (Copy این‌ها به Dashboard)

### Required:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Optional:

```env
VITE_ALCHEMY_API_KEY=your_alchemy_key
VITE_HELIUS_API_KEY=your_helius_key
VITE_APP_FEE_WALLET=your_solana_address
```

---

## 🚀 Platform URLs

### Vercel:
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs

### Netlify:
- Dashboard: https://app.netlify.com
- Docs: https://docs.netlify.com

### Cloudflare Pages:
- Dashboard: https://dash.cloudflare.com
- Docs: https://developers.cloudflare.com/pages

---

## 🔍 Check Deployment Readiness

```bash
# اجرا کردن check script
bash check-deployment-ready.sh

# یا manual check:
npm run build
# اگر موفق شد → آماده deploy!
```

---

## 🆘 Quick Troubleshooting

### Build Fails:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Env Variables Not Working:
```
1. مطمئن شوید VITE_ prefix دارند
2. در dashboard platform اضافه کنید
3. Redeploy
```

### Supabase Connection Error:
```
1. بررسی URL صحیح است
2. بررسی keys صحیح هستند
3. بررسی Supabase project در دسترس است
```

---

## 📚 Documentation Files

```
📖 /DEPLOYMENT_COMPLETE_GUIDE.md    - راهنمای کامل
⚡ /DEPLOY_NOW_VERCEL.md             - Quick start برای Vercel
📋 .env.example                       - Template متغیرها
🔧 check-deployment-ready.sh         - Script بررسی
```

---

## ✅ Post-Deployment Checklist

```
□ Site loads در browser
□ Create account کار می‌کند
□ Wallet unlock می‌شود
□ Balances نمایش داده می‌شوند
□ Send/Receive کار می‌کند
□ Swap page باز می‌شود
□ Settings accessible است
□ Console بدون critical errors است
□ Mobile responsive است
□ PWA install کار می‌کند
```

---

## 🎯 Key Files Structure

```
/
├── package.json              # Dependencies
├── vite.config.ts           # Build config
├── tsconfig.json            # TypeScript config
├── index.html               # Entry point
├── vercel.json              # Vercel config
├── netlify.toml             # Netlify config
├── .env.example             # Env template
├── App.tsx                  # Main app
└── src/
    └── main.tsx             # Entry script
```

---

## 💡 Pro Tips

### Auto-Deploy:
```
✅ هر git push خودکار deploy می‌شود
✅ Preview deployments برای branches
✅ Rollback با یک کلیک
```

### Performance:
```
✅ همیشه npm run build test کنید
✅ Lighthouse score را check کنید
✅ Vercel Analytics را enable کنید
```

### Security:
```
✅ هیچوقت .env را commit نکنید
✅ Service Role Key را فقط server-side استفاده کنید
✅ CORS settings را درست تنظیم کنید
```

---

**این صفحه را bookmark کنید! 🔖**
