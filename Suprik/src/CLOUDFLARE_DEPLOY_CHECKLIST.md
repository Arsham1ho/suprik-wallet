# ✅ Cloudflare Pages Deploy Checklist

برای Suprik Wallet 🚀

---

## 📋 قبل از Deploy

### Git Setup

```
□ git init انجام شده
□ همه فایل‌ها commit شده‌اند
□ repository در GitHub/GitLab ساخته شده
□ git push موفق بوده
□ branch main وجود دارد
```

### Environment Variables آماده

```
□ VITE_SUPABASE_URL دارم
□ VITE_SUPABASE_ANON_KEY دارم
□ VITE_SUPABASE_SERVICE_ROLE_KEY دارم
□ VITE_ALCHEMY_API_KEY (اختیاری)
□ VITE_HELIUS_API_KEY (اختیاری)
□ VITE_APP_FEE_WALLET (اختیاری)
```

### Local Build Test

```bash
□ npm install موفق است
□ npm run build بدون error
□ npm run preview کار می‌کند
□ dist/ folder ساخته شده
```

---

## 🚀 حین Deploy

### Cloudflare Dashboard

```
□ ثبت‌نام/ورود به Cloudflare
□ رفتن به Workers & Pages
□ کلیک Create application
□ انتخاب Pages
□ کلیک Connect to Git
```

### Git Connection

```
□ انتخاب Git provider (GitHub/GitLab/Bitbucket)
□ Authorize کردن Cloudflare
□ پیدا کردن repository "suprik-wallet"
□ کلیک Begin setup
```

### Build Configuration

```
□ Project name: suprik-wallet (یا هر نام دیگری)
□ Production branch: main
□ Framework preset: Vite
□ Build command: npm run build
□ Build output directory: dist (نه /dist!)
```

### Environment Variables

```
□ اضافه کردن VITE_SUPABASE_URL
□ اضافه کردن VITE_SUPABASE_ANON_KEY
□ اضافه کردن VITE_SUPABASE_SERVICE_ROLE_KEY
□ اضافه کردن متغیرهای اختیاری (اگر نیاز است)
□ همه متغیرها VITE_ prefix دارند
```

### Final Deploy

```
□ دوباره check کردن همه تنظیمات
□ کلیک Save and Deploy
□ منتظر ماندن (2-4 دقیقه)
□ بررسی build logs
```

---

## ✅ بعد از Deploy

### اولین تست

```
□ صفحه باز می‌شود: https://suprik-wallet-xxx.pages.dev
□ بدون error در loading
□ CSS load شده
□ JavaScript کار می‌کند
```

### Feature Testing

```
□ صفحه Landing نمایش داده می‌شود
□ دکمه "Create Account" کار می‌کند
□ Generate mnemonic موفق است
□ ذخیره wallet موفق است
□ Unlock wallet کار می‌کند
□ Home page باز می‌شود
□ Token balances نمایش داده می‌شوند (حتی 0)
□ Navigation پایینی کار می‌کند
```

### Advanced Features

```
□ Send page قابل دسترسی است
□ Receive dialog باز می‌شود
□ QR code generation کار می‌کند
□ Swap page باز می‌شود
□ Token selection کار می‌کند
□ Activity page accessible است
□ Settings باز می‌شود
```

### Console Check (F12)

```
□ بدون critical errors
□ Supabase connection موفق
□ API calls successful (یا با fallback)
□ بدون CORS errors
□ Assets load می‌شوند
```

### Mobile Testing

```
□ Responsive در mobile
□ Touch events کار می‌کنند
□ Navigation smooth است
□ PWA install prompt نمایش داده می‌شود
```

---

## 🔧 Post-Deploy Setup

### Optional Improvements

```
□ اضافه کردن custom domain
□ Setup analytics
□ Enable Web Vitals monitoring
□ Configure caching headers
□ Add _headers file برای security
```

### Performance Check

```
□ Lighthouse score: > 90
□ First Contentful Paint: < 1.5s
□ Time to Interactive: < 3.5s
□ Total bundle size: check
```

---

## 🐛 Troubleshooting Checklist

### Build Failed?

```
□ Check build logs در Cloudflare
□ Build output directory = dist است؟
□ npm run build local موفق است؟
□ node_modules/ corrupt نیست؟
□ package.json صحیح است؟
```

### Env Variables Issues?

```
□ همه متغیرها VITE_ prefix دارند؟
□ در dashboard اضافه شده‌اند؟
□ typo ندارند؟
□ Redeploy کردم؟
```

### Site Loads But Broken?

```
□ F12 Console errors چیست؟
□ Network tab چک کردم؟
□ Supabase keys صحیح هستند؟
□ CORS settings درست است؟
```

---

## 📊 Success Criteria

### ✅ همه اینها باید درست باشد:

```
✅ Build successful در Cloudflare
✅ Site accessible: https://suprik-wallet-xxx.pages.dev
✅ HTTPS enabled
✅ Landing page loads
✅ Create account works
✅ Wallet unlock works
✅ Token display works
✅ Navigation works
✅ Mobile responsive
✅ PWA installable
✅ No critical console errors
```

---

## 🎯 اگر همه ✅ است:

```
🎉 موفق! Deploy کامل است!
🔗 اپ شما live است
📱 آماده برای استفاده
🚀 آماده برای production
```

---

## 📚 مراحل بعدی

```
□ تست با کاربران واقعی
□ جمع‌آوری feedback
□ مانیتور کردن errors
□ بررسی analytics
□ بهبود performance
□ اضافه کردن features جدید
```

---

## 🆘 اگر مشکلی هست

### مراجع:

```
📖 راهنمای کامل: /DEPLOY_CLOUDFLARE_COMPLETE.md
⚡ Quick guide: /DEPLOY_CLOUDFLARE_QUICK.md
📋 Troubleshooting: /DEPLOYMENT_COMPLETE_GUIDE.md
🔗 Cloudflare Docs: https://developers.cloudflare.com/pages
```

---

**✅ این checklist را print کنید و tick کنید! 📝**

**🚀 موفق باشید!**
