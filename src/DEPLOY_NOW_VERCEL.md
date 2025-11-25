# ⚡ Deploy به Vercel در 5 دقیقه!

**سریع‌ترین راه برای live کردن Suprik 🚀**

---

## 🎯 قبل از شروع

این اطلاعات را آماده کنید:

```
✅ GitHub account
✅ Supabase project URL
✅ Supabase Anon Key
✅ Supabase Service Role Key
```

**ندارید؟** برگردید به `/DEPLOYMENT_COMPLETE_GUIDE.md`

---

## 🚀 مرحله 1: Push به GitHub (2 دقیقه)

```bash
# اگر git init نکرده‌اید:
git init
git add .
git commit -m "Initial commit - Suprik ready!"

# ساخت repo در GitHub: https://github.com/new
# بعد:
git remote add origin https://github.com/YOUR_USERNAME/suprik-wallet.git
git branch -M main
git push -u origin main
```

---

## 🚀 مرحله 2: Connect به Vercel (1 دقیقه)

### 2.1 برو به Vercel
```
https://vercel.com/signup
```

### 2.2 Import Project
```
1. کلیک "Add New Project"
2. انتخاب GitHub
3. پیدا کردن "suprik-wallet"
4. کلیک "Import"
```

---

## 🚀 مرحله 3: Configure (2 دقیقه)

### 3.1 Build Settings (خودکار detect می‌شود)

```
✅ Framework Preset: Vite
✅ Build Command: npm run build
✅ Output Directory: dist
```

### 3.2 Environment Variables

**کلیک "Environment Variables"** و اضافه کردن:

```env
# 1. Supabase URL
Name: VITE_SUPABASE_URL
Value: https://qagsgxsaxspomcysaesa.supabase.co

# 2. Supabase Anon Key
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...

# 3. Supabase Service Role Key
Name: VITE_SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...

# 4. Alchemy (اختیاری)
Name: VITE_ALCHEMY_API_KEY
Value: your_alchemy_key

# 5. Helius (اختیاری)
Name: VITE_HELIUS_API_KEY
Value: your_helius_key

# 6. Fee Wallet (اختیاری)
Name: VITE_APP_FEE_WALLET
Value: your_solana_address
```

**مهم:** برای هر variable، `Production`, `Preview`, و `Development` را تیک بزنید!

---

## 🚀 مرحله 4: Deploy! (2-3 دقیقه)

```
کلیک "Deploy"
```

**Vercel الان:**
```
⏳ Installing dependencies...
⏳ Building your app...
⏳ Deploying to CDN...
✅ Deploy successful!
```

---

## 🎉 مرحله 5: تست!

### آدرس شما:
```
https://suprik-wallet-xxx.vercel.app
```

### تست این‌ها را:
```
✅ صفحه باز می‌شود
✅ "Create Account" کار می‌کند
✅ Wallet قابل unlock است
✅ Balances نمایش داده می‌شوند
```

---

## 🔥 بعدی: Auto-Deploy

حالا هر بار که push می‌کنید:

```bash
git add .
git commit -m "Update feature X"
git push
```

Vercel **خودکار** deploy می‌کند! 🎉

---

## 🐛 مشکل داری؟

### Build Failed?

```bash
# Check build logs در Vercel dashboard
# معمولاً به خاطر:
❌ Environment variable فراموش شده
❌ Supabase keys اشتباه

Fix: Settings > Environment Variables > Add missing ones
```

### Site Loads But Errors?

```
F12 > Console
ببین چه error ای می‌دهد

Common:
❌ "Supabase URL undefined" → env variable اضافه نشده
❌ "Network error" → Supabase keys اشتباه است
```

---

## ✅ Done!

```
🎉 اپ شما live است!
🔗 Share کن: https://your-app.vercel.app
📈 Vercel Analytics رایگان دارید
🚀 هر push = auto deploy
```

---

## 📚 Next Steps

1. **Custom Domain**: Settings > Domains
2. **Analytics**: Enable Vercel Analytics
3. **Monitor**: Check dashboard برای traffic
4. **Improve**: بر اساس user feedback

---

**تبریک! Suprik شما حالا زنده است! 🎊**

نیاز به راهنمای کامل؟ ببین: `/DEPLOYMENT_COMPLETE_GUIDE.md`
