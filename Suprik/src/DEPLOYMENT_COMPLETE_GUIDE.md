# 🚀 راهنمای کامل Deploy کردن Suprik

**تاریخ**: 25 نوامبر 2024  
**وضعیت**: ✅ آماده Deploy  
**زمان تخمینی**: 10-15 دقیقه

---

## 📋 فهرست مطالب

1. [پیش‌نیازها](#پیش-نیازها)
2. [آماده‌سازی پروژه](#آماده-سازی-پروژه)
3. [Deploy به Vercel (ساده‌ترین)](#deploy-به-vercel)
4. [Deploy به Netlify](#deploy-به-netlify)
5. [Deploy به Cloudflare Pages](#deploy-به-cloudflare)
6. [تنظیم Environment Variables](#تنظیم-environment-variables)
7. [تست و Troubleshooting](#تست-و-troubleshooting)

---

## 🔧 پیش‌نیازها

### 1. Git Repository

اگر هنوز Git repo ندارید:

```bash
# Initialize Git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Suprik Wallet ready for deployment"

# Push to GitHub (یا GitLab/Bitbucket)
# ابتدا یک repo در GitHub بسازید، سپس:
git remote add origin https://github.com/YOUR_USERNAME/suprik-wallet.git
git branch -M main
git push -u origin main
```

### 2. Supabase Project

از https://supabase.com این اطلاعات را دریافت کنید:
- Project URL
- Anon Key
- Service Role Key

### 3. API Keys (اختیاری اما توصیه می‌شود)

- **Alchemy** (برای Ethereum): https://www.alchemy.com/
- **Helius** (برای Solana): https://www.helius.dev/

---

## ⚙️ آماده‌سازی پروژه

### 1. بررسی فایل‌های مورد نیاز

همه این فایل‌ها باید وجود داشته باشند:

```
✅ package.json
✅ vite.config.ts
✅ tsconfig.json
✅ index.html
✅ vercel.json
✅ .env.example
```

### 2. ساخت فایل .env (محلی)

```bash
# کپی کردن template
cp .env.example .env

# ویرایش و پر کردن مقادیر
nano .env  # یا با هر ویرایشگری که دوست دارید
```

مثال `.env`:

```env
VITE_SUPABASE_URL=https://qagsgxsaxspomcysaesa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ALCHEMY_API_KEY=your_alchemy_key
VITE_HELIUS_API_KEY=your_helius_key
VITE_APP_FEE_WALLET=your_wallet_address
```

### 3. تست Local Build

```bash
# نصب dependencies
npm install

# Build برای production
npm run build

# تست build
npm run preview
```

اگر build موفق بود، آماده deploy هستید! ✅

---

## 🚀 Deploy به Vercel (توصیه می‌شود!)

### چرا Vercel؟
✅ ساده‌ترین  
✅ سریع‌ترین  
✅ رایگان برای personal projects  
✅ Auto-deploy هر push  
✅ Preview deployments برای PRs  

### مراحل:

#### 1. ثبت‌نام در Vercel

رفتن به: https://vercel.com/signup

#### 2. Import کردن Repository

```
1. کلیک روی "Add New Project"
2. انتخاب Git provider (GitHub/GitLab/Bitbucket)
3. انتخاب repository شما
4. کلیک Import
```

#### 3. تنظیم Project Settings

Vercel خودکار Vite را تشخیص می‌دهد، اما بررسی کنید:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### 4. اضافه کردن Environment Variables

در صفحه تنظیمات Vercel:

```
Settings > Environment Variables > Add

برای هر متغیر:
Name: VITE_SUPABASE_URL
Value: https://qagsgxsaxspomcysaesa.supabase.co
Environment: Production, Preview, Development
```

متغیرهای لازم:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`
- `VITE_ALCHEMY_API_KEY` (اختیاری)
- `VITE_HELIUS_API_KEY` (اختیاری)
- `VITE_APP_FEE_WALLET` (اختیاری)

#### 5. Deploy!

```
کلیک "Deploy" و منتظر بمانید!
⏱️ معمولاً 2-3 دقیقه طول می‌کشد
```

#### 6. تنظیم Supabase Edge Functions

در Vercel dashboard:

```
Settings > Functions > Region
انتخاب: Closest to your Supabase region
```

#### 7. آدرس نهایی شما:

```
https://your-project-name.vercel.app
```

---

## 🌐 Deploy به Netlify

### مراحل:

#### 1. ثبت‌نام در Netlify

https://app.netlify.com/signup

#### 2. Connect به Git

```
1. "Add new site" > "Import an existing project"
2. انتخاب Git provider
3. انتخاب repository
```

#### 3. Build Settings

```
Base directory: (خالی بگذارید)
Build command: npm run build
Publish directory: dist
```

#### 4. Environment Variables

```
Site settings > Environment variables > Add

همان متغیرهای Vercel را اضافه کنید
```

#### 5. Deploy

```
کلیک "Deploy site"
```

#### 6. آدرس نهایی:

```
https://your-site-name.netlify.app
```

---

## ☁️ Deploy به Cloudflare Pages

### مراحل:

#### 1. ثبت‌نام در Cloudflare

https://dash.cloudflare.com/sign-up

#### 2. Create a Pages Project

```
Workers & Pages > Create application > Pages > Connect to Git
```

#### 3. Build Configuration

```
Framework preset: Vite
Build command: npm run build
Build output directory: /dist
```

#### 4. Environment Variables

```
Settings > Environment variables

همان متغیرها
```

#### 5. Deploy

```
کلیک "Save and Deploy"
```

#### 6. آدرس نهایی:

```
https://your-project.pages.dev
```

---

## 🔐 تنظیم Environment Variables

### متغیرهای ضروری:

#### 1. Supabase (ضروری)

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**چطور پیدا کنم؟**
```
1. برو به https://app.supabase.com
2. انتخاب project
3. Settings > API
4. کپی کردن URL و Keys
```

#### 2. Alchemy (اختیاری - برای Ethereum)

```bash
VITE_ALCHEMY_API_KEY=your_key_here
```

**چطور بگیرم؟**
```
1. https://www.alchemy.com/
2. ساخت account
3. Create App > Ethereum Mainnet
4. کپی API Key
```

#### 3. Helius (اختیاری - برای Solana)

```bash
VITE_HELIUS_API_KEY=your_key_here
```

**چطور بگیرم؟**
```
1. https://www.helius.dev/
2. ساخت account
3. Create API Key
4. کپی کردن
```

#### 4. Fee Wallet (اختیاری)

```bash
VITE_APP_FEE_WALLET=your_solana_address
```

این آدرس Solana شما برای دریافت fees است.

---

## 🔍 تست بعد از Deploy

### 1. بررسی Build Log

```
✅ Build successful
✅ Deploy successful
✅ No errors
```

### 2. تست Features

باز کردن سایت و تست:

#### ✅ Checklist:

- [ ] صفحه Landing load می‌شود
- [ ] Create Account کار می‌کند
- [ ] ذخیره mnemonic
- [ ] Unlock wallet
- [ ] نمایش SOL/USDC balances
- [ ] Swap page باز می‌شود
- [ ] Send page کار می‌کند
- [ ] Activity log نمایش داده می‌شود
- [ ] Settings کار می‌کند

### 3. بررسی Console

باز کردن DevTools (F12) و بررسی:

```
✅ No critical errors
✅ API calls موفق هستند
✅ Supabase connected است
```

---

## 🐛 Troubleshooting

### مشکل: Build Failed

#### Error: "Cannot find module X"

```bash
# Fix: نصب مجدد dependencies
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Error: "VITE_ variable not defined"

```
Fix: اضافه کردن متغیر در dashboard platform
همه متغیرهای VITE_ باید در dashboard تعریف شوند
```

### مشکل: Site loads but features don't work

#### Console Error: "Supabase URL not defined"

```
Fix:
1. بررسی Environment Variables در dashboard
2. مطمئن شوید VITE_ prefix دارند
3. Redeploy کردن
```

#### Error: "Network request failed"

```
Fix:
1. بررسی Supabase project در دسترس است
2. بررسی API keys صحیح هستند
3. بررسی CORS settings در Supabase
```

### مشکل: Swap doesn't work

```
علت: Jupiter API در production هم ممکن است unavailable باشد

Fix: این طبیعی است! اپ در Simulation Mode کار می‌کند
برای real swaps نیاز به:
- RPC endpoint خوب
- یا Alternative DEX integration
```

---

## 🎯 بعد از Deploy چکار کنم؟

### 1. Custom Domain (اختیاری)

#### Vercel:
```
Settings > Domains > Add Domain
```

#### Netlify:
```
Domain settings > Add custom domain
```

#### Cloudflare:
```
Custom domains > Set up a custom domain
```

### 2. SSL Certificate

همه platformها SSL رایگان می‌دهند (خودکار).

### 3. Analytics (اختیاری)

- Vercel Analytics
- Google Analytics
- Plausible

### 4. Performance Monitoring

```bash
# Lighthouse score
Run in Chrome DevTools
Target: 90+ score
```

---

## 📊 Comparison جدول Platform ها

| Feature | Vercel | Netlify | Cloudflare |
|---------|--------|---------|------------|
| **Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Speed** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Free Tier** | 100GB/mo | 100GB/mo | Unlimited |
| **Build Time** | ~2 min | ~3 min | ~2 min |
| **Edge Functions** | ✅ | ✅ | ✅ |
| **Auto Deploy** | ✅ | ✅ | ✅ |
| **Custom Domain** | ✅ Free | ✅ Free | ✅ Free |
| **SSL** | ✅ Auto | ✅ Auto | ✅ Auto |
| **Analytics** | ✅ | ✅ | ✅ |
| **Best For** | React/Next | All | Global CDN |

**پیشنهاد:** Vercel برای شروع! 🚀

---

## ✅ نتیجه‌گیری

### اگر همه چیز درست پیش رفت:

```
✅ اپ شما live است!
✅ آدرس: https://your-app.vercel.app
✅ Auto-deploy هر push
✅ HTTPS enabled
✅ CDN optimized
✅ آماده برای کاربران واقعی!
```

### مراحل بعدی:

1. ✅ تست کامل features
2. ✅ اضافه کردن custom domain
3. ✅ Setup analytics
4. ✅ Monitor performance
5. ✅ جمع‌آوری feedback از کاربران

---

## 🆘 نیاز به کمک؟

### منابع:

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Cloudflare Docs**: https://developers.cloudflare.com/pages
- **Vite Docs**: https://vitejs.dev
- **Supabase Docs**: https://supabase.com/docs

### Common Issues:

همه مشکلات رایج در بخش Troubleshooting پوشش داده شده‌اند.

---

**🎉 تبریک! اپ Suprik شما آماده تسخیر دنیا است! 🚀**
