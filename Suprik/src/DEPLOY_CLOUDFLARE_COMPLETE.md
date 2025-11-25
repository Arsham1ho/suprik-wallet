# 🚀 Deploy Suprik به Cloudflare Pages - راهنمای کامل

**زمان تخمینی**: 8-10 دقیقه  
**سختی**: ⭐⭐⭐ (متوسط)  
**هزینه**: 🆓 رایگان

---

## 🎯 چرا Cloudflare Pages؟

```
✅ CDN جهانی با سرعت بالا
✅ Unlimited bandwidth رایگان
✅ SSL خودکار
✅ DDoS protection
✅ Edge computing
✅ Git integration
✅ Preview deployments
```

---

## 📋 پیش‌نیازها

### 1. Git Repository

```bash
# اگر هنوز Git init نکرده‌اید:
git init
git add .
git commit -m "Ready for Cloudflare Pages deployment"

# Push به GitHub/GitLab/Bitbucket
git remote add origin https://github.com/YOUR_USERNAME/suprik-wallet.git
git branch -M main
git push -u origin main
```

### 2. Cloudflare Account

ثبت‌نام رایگان: https://dash.cloudflare.com/sign-up

### 3. Environment Variables آماده

این اطلاعات را آماده کنید:

```env
VITE_SUPABASE_URL=https://qagsgxsaxspomcysaesa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
VITE_ALCHEMY_API_KEY=... (اختیاری)
VITE_HELIUS_API_KEY=... (اختیاری)
VITE_APP_FEE_WALLET=... (اختیاری)
```

---

## 🚀 مراحل Deploy

### مرحله 1: ورود به Cloudflare Dashboard

1. برو به: https://dash.cloudflare.com
2. Login کنید (یا Sign up)
3. از sidebar انتخاب کنید: **Workers & Pages**

---

### مرحله 2: Create a New Pages Project

```
1. کلیک "Create application"
2. انتخاب "Pages"
3. کلیک "Connect to Git"
```

<div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin: 10px 0;">
💡 <strong>نکته</strong>: اگر اولین باره که از Cloudflare Pages استفاده می‌کنید،
باید GitHub/GitLab را authorize کنید.
</div>

---

### مرحله 3: Connect Git Repository

```
1. انتخاب Git provider:
   - GitHub (پیشنهاد)
   - GitLab
   - Bitbucket

2. Grant permissions به Cloudflare

3. پیدا کردن repository "suprik-wallet"

4. کلیک "Begin setup"
```

---

### مرحله 4: Configure Build Settings

این تنظیمات را وارد کنید:

```
┌─────────────────────────────────────────┐
│ Project name                            │
├─────────────────────────────────────────┤
│ suprik-wallet                           │
│ (می‌توانید تغییر دهید)                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Production branch                       │
├─────────────────────────────────────────┤
│ main                                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Framework preset                        │
├─────────────────────────────────────────┤
│ Vite                                    │
│ (خودکار detect می‌شود)                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Build command                           │
├─────────────────────────────────────────┤
│ npm run build                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Build output directory                  │
├─────────────────────────────────────────┤
│ dist                                    │
└─────────────────────────────────────────┘
```

**⚠️ مهم**: مطمئن شوید "Build output directory" دقیقاً `dist` باشد (نه `/dist`)

---

### مرحله 5: Environment Variables

**قبل از Deploy، حتماً env variables را اضافه کنید!**

```
1. Scroll down به "Environment variables"

2. کلیک "Add variable"

3. برای هر variable:
```

#### Variable 1: VITE_SUPABASE_URL

```
Variable name: VITE_SUPABASE_URL
Value: https://qagsgxsaxspomcysaesa.supabase.co
```

#### Variable 2: VITE_SUPABASE_ANON_KEY

```
Variable name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
```

#### Variable 3: VITE_SUPABASE_SERVICE_ROLE_KEY

```
Variable name: VITE_SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
```

#### Variable 4: VITE_ALCHEMY_API_KEY (اختیاری)

```
Variable name: VITE_ALCHEMY_API_KEY
Value: your_alchemy_key_here
```

#### Variable 5: VITE_HELIUS_API_KEY (اختیاری)

```
Variable name: VITE_HELIUS_API_KEY
Value: your_helius_key_here
```

#### Variable 6: VITE_APP_FEE_WALLET (اختیاری)

```
Variable name: VITE_APP_FEE_WALLET
Value: your_solana_wallet_address
```

<div style="background: #ff4444; color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
⚠️ <strong>خیلی مهم</strong>: همه متغیرها باید prefix <code>VITE_</code> داشته باشند!
</div>

---

### مرحله 6: Deploy!

```
1. همه تنظیمات را دوباره check کنید

2. کلیک "Save and Deploy"

3. Cloudflare شروع می‌کند به:
   ⏳ Cloning repository
   ⏳ Installing dependencies
   ⏳ Building your app
   ⏳ Deploying to edge

4. منتظر بمانید (معمولاً 2-4 دقیقه)
```

---

### مرحله 7: آدرس نهایی شما

بعد از deploy موفق:

```
✅ Your site is live!

🔗 URL: https://suprik-wallet-xxx.pages.dev

🎉 تبریک! اپ شما الان زنده است!
```

---

## 🔧 تنظیمات بعد از Deploy

### 1. Custom Domain (اختیاری)

```
1. در Cloudflare Pages dashboard
2. انتخاب project شما
3. Custom domains > Set up a custom domain
4. وارد کردن domain خودتان
5. دنبال کردن دستورالعمل DNS
```

### 2. Build Settings

```
Settings > Builds & deployments

می‌توانید تغییر دهید:
- Build command
- Branch deployments
- Build cache
```

### 3. Preview Deployments

```
✅ خودکار برای هر branch
✅ خودکار برای هر PR
✅ هر commit = یک preview URL
```

---

## 🔄 Updates و Redeployment

### Auto-Deploy

```bash
# هر بار که push می‌کنید:
git add .
git commit -m "Update feature"
git push

# Cloudflare خودکار rebuild و redeploy می‌کند!
```

### Manual Redeploy

```
1. Cloudflare Dashboard
2. انتخاب project
3. Deployments
4. کلیک "Retry deployment"
```

### Rollback

```
1. Deployments tab
2. پیدا کردن deployment قبلی
3. کلیک "Rollback to this deployment"
```

---

## 🎯 تست بعد از Deploy

### 1. باز کردن Site

```
https://suprik-wallet-xxx.pages.dev
```

### 2. Checklist تست:

```
□ صفحه Landing load می‌شود
□ Create Account کار می‌کند
□ ذخیره mnemonic موفق است
□ Unlock wallet کار می‌کند
□ Token balances نمایش داده می‌شوند
□ Send page قابل دسترسی است
□ Swap page باز می‌شود
□ Activity log کار می‌کند
□ Settings accessible است
□ Mobile responsive است
□ PWA install می‌شود
```

### 3. بررسی Console

```
F12 > Console

✅ بررسی کنید:
- No critical errors
- Supabase connected
- API calls موفق
```

---

## 🐛 Troubleshooting

### مشکل: Build Failed

#### Error: "Command not found: npm"

```
Fix:
1. Settings > Environment variables
2. اضافه کردن: NODE_VERSION = 18
3. Retry deployment
```

#### Error: "ENOENT: no such file or directory"

```
Fix:
بررسی Build output directory = dist
نه /dist
نه ./dist
فقط: dist
```

#### Error: "Module not found"

```bash
# مشکل در dependencies

Fix:
1. Local test بگیرید:
   rm -rf node_modules package-lock.json
   npm install
   npm run build

2. اگر موفق شد، git push کنید
3. Cloudflare دوباره try می‌کند
```

---

### مشکل: Site Loads But Features Don't Work

#### Console Error: "VITE_SUPABASE_URL is not defined"

```
Fix:
1. Dashboard > Settings > Environment variables
2. مطمئن شوید همه variables اضافه شده‌اند
3. مطمئن شوید VITE_ prefix دارند
4. Redeploy: Deployments > Retry deployment
```

#### Console Error: "Failed to fetch"

```
Possible causes:
1. Supabase URL اشتباه است
2. Supabase project down است
3. CORS issues

Fix:
1. بررسی Supabase dashboard
2. بررسی API keys
3. Test in local با همان env variables
```

---

### مشکل: Slow Loading

```
Cloudflare Pages خیلی سریع است، اما:

Check:
1. Asset size (bundle size)
2. Images optimization
3. Lazy loading
4. Network در DevTools

Optimize:
1. npm run build -- --report
2. Analyze bundle size
3. Code splitting
4. Image compression
```

---

## 📊 Performance & Monitoring

### Cloudflare Analytics

```
1. Dashboard > Analytics & Logs
2. Web Analytics
3. بررسی:
   - Page views
   - Unique visitors
   - Top pages
   - Performance metrics
```

### Custom Analytics

```javascript
// می‌توانید اضافه کنید:
// Google Analytics
// Plausible
// Mixpanel
```

---

## 🔐 Security

### Headers

Cloudflare خودکار اضافه می‌کند:

```
✅ HTTPS enforcement
✅ DDoS protection
✅ WAF (Web Application Firewall)
✅ Bot protection
```

### Custom Headers

```
1. Create file: public/_headers

2. محتوا:
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
```

---

## 💰 Pricing (رایگان!)

### Free Tier شامل:

```
✅ Unlimited sites
✅ Unlimited requests
✅ Unlimited bandwidth
✅ 500 builds/month
✅ Concurrent builds: 1
✅ Git integration
✅ Custom domains
✅ SSL certificates
✅ DDoS protection
```

**کافی است برای اکثر پروژه‌ها! 🎉**

---

## 🎓 نکات Pro

### 1. Branch Deployments

```
✅ هر branch = یک preview URL
✅ Test قبل از merge
✅ خودکار cleanup
```

### 2. Build Cache

```
Settings > Build cache

✅ سرعت build بیشتر
✅ کمتر منتظر ماندن
```

### 3. Edge Functions

```
می‌توانید اضافه کنید:
- API routes
- Authentication
- Data transformation
```

### 4. Redirects

در `public/_redirects`:

```
/old-path /new-path 301
/api/* https://api.example.com/:splat 200
```

---

## 🆚 Cloudflare vs Vercel vs Netlify

| Feature | Cloudflare | Vercel | Netlify |
|---------|-----------|--------|---------|
| **Bandwidth** | Unlimited | 100GB | 100GB |
| **Builds** | 500/mo | Unlimited | 300/mo |
| **Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Setup** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Global CDN** | 300+ locations | 100+ | 100+ |
| **DDoS** | ✅ Built-in | ✅ | ✅ |

**Cloudflare برای high-traffic مناسب است! 📈**

---

## 📚 منابع

### Official Docs:

```
🔗 Cloudflare Pages: https://developers.cloudflare.com/pages
🔗 Vite + Cloudflare: https://developers.cloudflare.com/pages/framework-guides/vite
🔗 Environment Variables: https://developers.cloudflare.com/pages/platform/build-configuration
```

### Dashboard:

```
🔗 Cloudflare Dashboard: https://dash.cloudflare.com
🔗 Analytics: https://dash.cloudflare.com/?to=/:account/pages
```

---

## ✅ نتیجه‌گیری

### بعد از دنبال کردن این راهنما:

```
✅ اپ شما live است
✅ URL: https://suprik-wallet-xxx.pages.dev
✅ HTTPS enabled
✅ CDN جهانی
✅ DDoS protection
✅ Auto-deploy setup
✅ Preview deployments
✅ آماده برای production!
```

### مراحل بعدی:

```
1. ✅ تست کامل features
2. ✅ اضافه کردن custom domain
3. ✅ Setup analytics
4. ✅ Monitor performance
5. ✅ جمع‌آوری user feedback
```

---

## 🆘 نیاز به کمک؟

### سوالات متداول:

**Q: چقدر طول می‌کشد؟**  
A: 8-10 دقیقه

**Q: رایگان است؟**  
A: بله! Unlimited bandwidth

**Q: می‌توانم custom domain داشته باشم؟**  
A: بله! رایگان و ساده

**Q: چطور update کنم؟**  
A: فقط git push - خودکار deploy می‌شود!

---

**🎉 تبریک! Suprik شما روی Cloudflare Pages زنده است! 🚀**

**نیاز به راهنمای سریع‌تر؟** ببین: `/DEPLOY_CLOUDFLARE_QUICK.md`
