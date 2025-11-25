# 🟠 راهنمای Deploy روی Cloudflare Pages

## ✅ بله! اپ شما آماده Deploy روی Cloudflare است!

من تمام فایل‌های لازم را آماده کردم.

---

## 🆚 Cloudflare Pages vs Vercel

| ویژگی | Cloudflare Pages | Vercel |
|-------|------------------|---------|
| **رایگان** | 500 builds/month | 100 deployments/month |
| **Bandwidth** | نامحدود! ⚡ | 100GB/month |
| **CDN** | بله (سریع‌تر!) | بله |
| **Edge Functions** | محدود | کامل |
| **قیمت** | ارزان‌تر 💰 | گران‌تر |

**توصیه:** برای اپ شما، Cloudflare Pages عالی است! ✅

---

## 📁 فایل‌های آماده شده:

✅ `/_redirects` - برای SPA routing  
✅ `/public/_headers` - برای security headers  
✅ `/wrangler.toml` - تنظیمات Cloudflare  
✅ `/src/main.tsx` - entry point  
✅ `/vercel.json` - (برای Vercel)

---

## 🚀 روش 1: Deploy از طریق Dashboard (ساده‌ترین!)

### گام 1️⃣: Push به GitHub

```bash
git add .
git commit -m "Add Cloudflare Pages configuration"
git push origin main
```

---

### گام 2️⃣: اتصال به Cloudflare

```
1. به Cloudflare بروید:
   👉 https://dash.cloudflare.com

2. "Workers & Pages" را انتخاب کنید

3. "Create application" → "Pages" tab

4. "Connect to Git" کلیک کنید

5. GitHub account خود را connect کنید

6. Repository خود را انتخاب کنید
   (suprik-wallet یا هر نامی که دارید)

7. "Begin setup" کلیک کنید
```

---

### گام 3️⃣: تنظیمات Build

در صفحه "Set up builds and deployments":

```
Project name:
suprik-wallet (یا هر نام دلخواه)

Production branch:
main

Framework preset:
☑ Vite

Build command:
npm run build

Build output directory:
dist

Root directory (optional):
/ (خالی بگذارید)
```

---

### گام 4️⃣: Environment Variables

**مهم!** این 4 متغیر را اضافه کنید:

#### متغیر 1:
```
Variable name: VITE_SUPABASE_URL
Value: https://qagsgxsaxspomcysaesa.supabase.co
```

#### متغیر 2:
```
Variable name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ3NneHNheHNwb21jeXNhZXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTEzMTIsImV4cCI6MjA3NzYyNzMxMn0.nXIq2kt816zG1yTPfG-FPDPubnPZ2n5tpQ7MFAB6sVM
```

#### متغیر 3:
```
Variable name: SUPABASE_SERVICE_ROLE_KEY
Value: [باید از Supabase Dashboard بگیرید]

چطور بگیرم؟
1. https://supabase.com/dashboard/project/qagsgxsaxspomcysaesa
2. Settings → API
3. "service_role" key را کپی کنید
```

#### متغیر 4:
```
Variable name: SUPABASE_DB_URL
Value: [باید از Supabase Dashboard بگیرید]

چطور بگیرم؟
1. همان Dashboard
2. Settings → Database
3. Connection string → URI
4. کپی کنید
```

---

### گام 5️⃣: Deploy!

```
1. دکمه "Save and Deploy" را بزنید

2. منتظر بمانید (2-5 دقیقه)

3. Build log را نگاه کنید:
   ✓ Cloning repository
   ✓ Installing dependencies
   ✓ Building application
   ✓ Deploying to Cloudflare's global network
   ✓ Success!

4. لینک شما آماده است:
   https://suprik-wallet.pages.dev
```

---

## 🚀 روش 2: Deploy از طریق CLI (پیشرفته)

### نصب Wrangler:

```bash
npm install -g wrangler

# یا
npm install -D wrangler
```

### Login به Cloudflare:

```bash
wrangler login
```

### Deploy:

```bash
# Build
npm run build

# Deploy
wrangler pages deploy dist --project-name=suprik-wallet
```

---

## 🔍 بررسی Build Log

### ✅ Build موفق:

```
14:32:15.123 Cloning repository...
14:32:16.456 Installing dependencies
14:32:18.789 > npm install
14:32:20.123 added 1250 packages in 2s
14:32:21.456 Building application
14:32:22.789 > npm run build
14:32:24.123 vite v6.0.3 building for production...
14:32:56.789 ✓ 1250 modules transformed
14:32:58.123 dist/index.html                  1.2 kB
14:32:58.234 dist/assets/index-abc123.css    45.3 kB
14:32:58.345 dist/assets/index-xyz789.js    854.2 kB
14:32:58.456 ✓ built in 32.5s
14:32:59.789 Deploying to Cloudflare's network...
14:33:02.123 Uploading... ████████████████████ 100%
14:33:03.456 ✓ Deployment complete!
14:33:03.567 ✓ https://suprik-wallet.pages.dev
```

---

## 🎯 تنظیمات بعد از Deploy

### Custom Domain (اختیاری):

```
1. Cloudflare Pages → پروژه شما
2. "Custom domains" tab
3. "Set up a custom domain"
4. دامنه خود را وارد کنید (مثلاً: suprik.com)
5. DNS records به صورت خودکار تنظیم می‌شوند
```

### Preview Deployments:

```
هر branch جدید = یک preview URL

مثال:
- main branch → https://suprik-wallet.pages.dev
- dev branch → https://dev.suprik-wallet.pages.dev
```

---

## ⚠️ تفاوت‌های مهم Cloudflare

### 1. Environment Variables در Build Time

```
متغیرهایی که با VITE_ شروع می‌شوند در build time استفاده می‌شوند.
پس از تغییر env variables، باید دوباره deploy کنید.
```

### 2. SPA Routing

```
✅ فایل _redirects را اضافه کردم
این مطمئن می‌شود که /swap, /activity و... به index.html هدایت شوند
```

### 3. Static Assets

```
فایل‌های داخل /public به صورت خودکار serve می‌شوند:
- /public/manifest.json → https://suprik-wallet.pages.dev/manifest.json
- /public/_headers → برای security headers
```

---

## 🐛 Troubleshooting

### مشکل 1: "Build failed - npm: command not found"

**راه حل:**

```
Cloudflare Pages → Settings → Environment variables
اضافه کنید:

NODE_VERSION = 18
```

### مشکل 2: "404 Not Found" روی route ها

**راه حل:**

```
چک کنید فایل _redirects در dist folder وجود دارد.

اگر نیست:
1. فایل _redirects را در /public بگذارید
2. یا در package.json این script را اضافه کنید:

"build": "vite build && cp _redirects dist/_redirects"
```

### مشکل 3: صفحه سفید

**راه حل:**

```
1. F12 → Console → چه خطایی دارد؟

2. احتمالاً Environment Variables نیست:
   Settings → Environment Variables → 4 متغیر را اضافه کنید

3. Retry deployment
```

### مشکل 4: "Failed to load module"

**راه حل:**

```
1. چک کنید build موفق شد

2. چک کنید dist/assets/ فایل‌های JS دارد

3. Browser cache را clear کنید (Ctrl + Shift + R)
```

---

## 📊 مقایسه Build Time

| Platform | Build Time | Deploy Time | کل |
|----------|------------|-------------|-----|
| Cloudflare | ~30-40 ثانیه | ~5-10 ثانیه | **~45s** |
| Vercel | ~40-50 ثانیه | ~5-10 ثانیه | **~55s** |

**Cloudflare معمولاً کمی سریع‌تر است! ⚡**

---

## 🔒 Security

### Headers (اضافه شد!)

فایل `/public/_headers` این‌ها را فعال می‌کند:

```
✅ X-Frame-Options: DENY (جلوگیری از clickjacking)
✅ X-Content-Type-Options: nosniff
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Cache-Control برای performance
```

---

## 🌍 CDN و Performance

### Cloudflare Network:

```
✅ 200+ شهر در سراسر جهان
✅ Automatic DDoS protection
✅ Automatic SSL certificate
✅ HTTP/2 & HTTP/3 support
✅ Brotli compression
```

---

## 💰 قیمت‌گذاری Cloudflare Pages

### رایگان:

```
✅ 500 builds per month
✅ Bandwidth نامحدود
✅ 1 concurrent build
✅ Unlimited sites
✅ Custom domains نامحدود
```

### Pro ($20/month):

```
✅ 5000 builds per month
✅ 5 concurrent builds
✅ Advanced analytics
```

**برای پروژه شما، پلن رایگان کافی است!** ✅

---

## 🔄 CI/CD Automatic

```
بعد از setup:

1. هر push به main → automatic deploy
2. هر PR → preview deployment
3. خودکار!

مثال:
git push origin main
→ Cloudflare به صورت خودکار build و deploy می‌کند
```

---

## 📱 تست بعد از Deploy

### چک‌لیست:

```
1. باز کردن سایت
   ✅ https://suprik-wallet.pages.dev

2. تست صفحه اصلی
   ✅ لوگو نمایش داده می‌شود
   ✅ دکمه "Get Started" کار می‌کند

3. تست routing
   ✅ /swap کار می‌کند (نه 404!)
   ✅ /activity کار می‌کند
   ✅ /settings کار می‌کند

4. تست Console
   ✅ F12 → Console
   ✅ خطایی نباشد

5. تست Mobile
   ✅ Responsive باشد
   ✅ PWA install prompt نمایش داده شود

6. تست Performance
   ✅ Lighthouse score > 90
```

---

## 🎉 مزایای Cloudflare برای اپ شما

### 1. Bandwidth نامحدود
```
برای wallet app که ممکن است users زیاد داشته باشد:
✅ هیچ محدودیتی ندارید
✅ هیچ هزینه اضافی ندارید
```

### 2. Performance
```
✅ CDN جهانی
✅ Auto-optimization
✅ سرعت بالا در ایران
```

### 3. Security
```
✅ DDoS protection
✅ SSL automatic
✅ Web Application Firewall (WAF)
```

### 4. قیمت
```
✅ رایگان!
✅ 500 builds/month کافی است
```

---

## 🔗 لینک‌های مفید

| چیز | لینک |
|-----|------|
| 🟠 Cloudflare Dashboard | https://dash.cloudflare.com |
| 📖 Cloudflare Pages Docs | https://developers.cloudflare.com/pages |
| 🟢 Supabase Dashboard | https://supabase.com/dashboard |
| 🛠️ Wrangler CLI Docs | https://developers.cloudflare.com/workers/wrangler |

---

## ✅ چک‌لیست Deploy:

```
قبل از Deploy:
[ ] Git repository آماده است
[ ] فایل‌های config موجود است (_redirects, wrangler.toml)
[ ] تمام changes را commit کردم
[ ] Push کردم به GitHub

در Cloudflare:
[ ] Account دارم / ساختم
[ ] Project ساختم
[ ] Repository را connect کردم
[ ] Build settings را تنظیم کردم:
    - Framework: Vite ✅
    - Build: npm run build ✅
    - Output: dist ✅
[ ] 4 Environment Variable اضافه کردم
[ ] Deploy کردم

بعد از Deploy:
[ ] Build موفق شد
[ ] سایت باز می‌شود
[ ] Console خطا ندارد
[ ] Routing کار می‌کند
[ ] Mobile responsive است
```

---

## 🚀 مراحل سریع (TL;DR)

```bash
# 1. Push کنید
git add .
git commit -m "Add Cloudflare Pages support"
git push origin main

# 2. در Cloudflare:
# - Workers & Pages → Create → Connect Git
# - Repository انتخاب کنید
# - Framework: Vite
# - Build: npm run build
# - Output: dist
# - Env Variables: 4 متغیر اضافه کنید
# - Deploy!

# 3. منتظر بمانید ~2-5 دقیقه

# 4. ✅ آماده!
# https://suprik-wallet.pages.dev
```

---

## 💬 سوالات متداول

### Q: می‌توانم هم Vercel و هم Cloudflare داشته باشم؟

**A:** بله! می‌توانید روی هر دو deploy کنید:
- Vercel: production
- Cloudflare: staging/test

### Q: کدام بهتر است؟

**A:** برای wallet app شما:
- **Cloudflare** → bandwidth نامحدود، ارزان‌تر ✅
- **Vercel** → راحت‌تر، analytics بهتر

### Q: Backend (Supabase) کار می‌کند؟

**A:** بله! کاملاً مستقل است:
- Frontend: Cloudflare Pages
- Backend: Supabase Edge Functions
- Database: Supabase Postgres

### Q: چطور Redeploy کنم؟

**A:** 
```
روش 1: git push (automatic!)
روش 2: Cloudflare Dashboard → Deployments → Retry
```

---

## 🎊 آماده Deploy!

**همه چیز آماده است!**

فایل‌های ساخته شده:
- ✅ `/_redirects` (SPA routing)
- ✅ `/public/_headers` (security)
- ✅ `/wrangler.toml` (config)
- ✅ `/src/main.tsx` (entry point)

**حالا فقط:**

```bash
git add .
git commit -m "Ready for Cloudflare Pages"
git push origin main
```

**بعد:** Cloudflare Dashboard → Connect Git → Deploy!

---

## 📞 به من بگویید:

**آماده Deploy هستید؟**

- 🟠 **"بله! الان deploy می‌کنم روی Cloudflare"**
  → عالی! بگویید چه اتفاقی افتاد

- 🔵 **"می‌خواهم Vercel و Cloudflare را مقایسه کنم"**
  → جدول مقایسه بالا را ببینید

- ❓ **"سوال دارم درباره [چیزی]"**
  → بپرسید!

- 🎯 **"روی هر دو deploy کنم؟"**
  → بله! می‌توانید

---

**موفق باشید! 🚀**

نتیجه deploy را به من بگویید! 🎉
