# 🚀 How to Publish Suplet Wallet

## راهنمای کامل انتشار وب‌سایت

---

## 🎯 بهترین گزینه‌های انتشار

### گزینه ۱: Vercel (پیشنهادی ⭐)
**بهترین برای:** React apps، رایگان، سریع، آسان

### گزینه ۲: Netlify
**بهترین برای:** PWA apps، رایگان، CI/CD عالی

### گزینه ۳: Cloudflare Pages
**بهترین برای:** Performance بالا، CDN جهانی

---

## 📦 گزینه ۱: Vercel (توصیه می‌شود)

### مرحله ۱: آماده‌سازی پروژه

```bash
# اگر Git repository ندارید، ایجاد کنید
git init
git add .
git commit -m "Initial commit - Suplet Wallet v2.0"
```

### مرحله ۲: ساخت اکانت Vercel

1. برو به: https://vercel.com
2. روی "Sign Up" کلیک کن
3. با GitHub account خودت وارد شو
4. اکانت رایگان کاملاً کافی است

### مرحله ۳: Deploy کردن

#### روش A: از طریق GitHub (آسان‌ترین)

1. **کد را به GitHub بفرست:**
```bash
# Repository جدید در GitHub بساز
# سپس:
git remote add origin https://github.com/YOUR_USERNAME/suplet-wallet.git
git branch -M main
git push -u origin main
```

2. **در Vercel:**
   - کلیک روی "New Project"
   - GitHub repository خودت را انتخاب کن
   - "Import" را بزن
   - Vercel خودکار تنظیمات React را تشخیص می‌دهد
   - روی "Deploy" کلیک کن

3. **✅ تمام!** لینک شما آماده است: `https://suplet-wallet.vercel.app`

#### روش B: از طریق CLI (سریع‌تر)

```bash
# نصب Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# برای production
vercel --prod
```

### مرحله ۴: تنظیم Environment Variables

در Vercel Dashboard:
1. برو به: Project Settings → Environment Variables
2. این متغیرها را اضافه کن:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=your_db_url
ALCHEMY_API_KEY=your_alchemy_key
HELIUS_API_KEY=your_helius_key
APP_FEE_WALLET=your_wallet_address
RESEND_API_KEY=your_resend_key
```

3. Save کن و Redeploy بزن

### مرحله ۵: دامنه سفارشی (اختیاری)

1. در Vercel برو به: Settings → Domains
2. دامنه خودت را اضافه کن (مثلاً: `suplet.app`)
3. DNS records را طبق دستورالعمل تنظیم کن
4. ✅ تمام!

---

## 📦 گزینه ۲: Netlify

### مرحله ۱: آماده‌سازی

```bash
# نصب Netlify CLI
npm install -g netlify-cli

# Login
netlify login
```

### مرحله ۲: Build Configuration

فایل `netlify.toml` بساز در root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### مرحله ۳: Deploy

```bash
# Deploy
netlify deploy

# Production deploy
netlify deploy --prod
```

یا از طریق UI:
1. https://app.netlify.com → New site from Git
2. GitHub repository را متصل کن
3. Build settings خودکار تشخیص داده می‌شود
4. Deploy کن

### مرحله ۴: Environment Variables

در Netlify Dashboard:
1. Site Settings → Environment Variables
2. همان متغیرهای بالا را اضافه کن
3. Redeploy

---

## 📦 گزینه ۳: Cloudflare Pages

### مرحله ۱: Deploy

1. https://pages.cloudflare.com
2. Sign up/Login
3. "Create a project"
4. Connect GitHub repository
5. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
6. Deploy

### مرحله ۲: Environment Variables

1. Settings → Environment Variables
2. اضافه کردن متغیرها
3. Redeploy

---

## 🔐 امنیت Environment Variables

### ⚠️ مهم: هرگز این کارها را نکن

❌ Environment variables را در کد commit نکن  
❌ API keys را در GitHub نگذار  
❌ Service Role Key را در frontend استفاده نکن

### ✅ روش صحیح

1. **Local Development:**
```bash
# فایل .env.local بساز (این فایل در .gitignore است)
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
# etc.
```

2. **Production:**
   - همه متغیرها را در Platform Dashboard تنظیم کن
   - از Secrets برای sensitive data استفاده کن

---

## 🌍 تنظیم دامنه سفارشی

### خرید دامنه

دامنه‌های پیشنهادی:
- Namecheap: https://namecheap.com
- Cloudflare: https://cloudflare.com
- Google Domains: https://domains.google

پیشنهاد: `suplet.app` یا `suplet.io`

### اتصال دامنه به Vercel

1. **در Vercel:**
   - Settings → Domains
   - Add domain: `suplet.app`

2. **در Domain Provider:**
   - DNS Management
   - اضافه کردن این records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **صبر کن** (5-60 دقیقه) تا DNS propagate شود

4. ✅ سایت شما در `https://suplet.app` آماده است!

---

## 📱 تنظیمات PWA

### مرحله ۱: HTTPS (الزامی برای PWA)

✅ Vercel/Netlify/Cloudflare خودکار HTTPS فراهم می‌کنند

### مرحله ۲: Service Worker

✅ قبلاً تنظیم شده در `/public/sw.js`

### مرحله ۳: Icons

✅ Icons در `/public/icons/` موجود هستند

### مرحله ۴: Test PWA

بعد از deploy:
1. سایت را در موبایل باز کن
2. باید دکمه "Install App" نمایش داده شود
3. Install کن و تست کن

---

## 🧪 تست بعد از Deploy

### Checklist

```bash
# 1. باز کردن سایت
✓ صفحه لود می‌شود
✓ لوگو نمایش داده می‌شود
✓ انیمیشن‌ها کار می‌کنند

# 2. ساخت wallet
✓ Recovery phrase تولید می‌شود
✓ Password set می‌شود
✓ Wallet ساخته می‌شود

# 3. تراکنش‌ها (Devnet)
✓ Balance نمایش داده می‌شود
✓ Send کار می‌کند
✓ Receive کار می‌کند
✓ Swap کار می‌کند

# 4. Features
✓ Account switching کار می‌کند
✓ Network switching کار می‌کند
✓ Settings باز می‌شود
✓ Lock/Unlock کار می‌کند

# 5. PWA
✓ Install prompt نمایش داده می‌شود
✓ App install می‌شود
✓ Offline mode کار می‌کند

# 6. Performance
✓ Load time < 3s
✓ No console errors
✓ Smooth animations
```

---

## 📊 Monitoring & Analytics

### پیشنهاد ۱: Vercel Analytics (رایگان)

```bash
# در package.json اضافه کن
npm install @vercel/analytics
```

```tsx
// در App.tsx
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### پیشنهاد ۲: Google Analytics

1. حساب Google Analytics بساز
2. Tracking ID بگیر
3. در HTML اضافه کن

### پیشنهاد ۳: Sentry (Error Tracking)

```bash
npm install @sentry/react
```

---

## 🚀 نکات بهینه‌سازی

### 1. Speed Optimization

✅ تصاویر را optimize کن  
✅ Code splitting استفاده کن  
✅ Lazy loading برای components  
✅ CDN برای static assets

### 2. SEO

```html
<!-- در index.html -->
<meta name="description" content="Suplet - Your friendly crypto wallet">
<meta name="keywords" content="crypto,wallet,solana,ethereum,web3">
<meta property="og:title" content="Suplet Wallet">
<meta property="og:description" content="The friendly crypto wallet">
<meta property="og:image" content="/og-image.png">
```

### 3. Security Headers

در `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

## 📢 بعد از انتشار

### 1. اعلام عمومی

```markdown
🚀 Suplet Wallet is LIVE! 🪐

Your friendly crypto wallet is now available!

✨ Features:
- Multi-chain support (Solana, Ethereum, Base)
- CosmoPay offline transfers
- Beautiful UI
- Secure & fast

🔗 Try it now: https://suplet.app

#Crypto #Web3 #Solana #DeFi
```

### 2. کجا share کنی

- Twitter/X
- Reddit (r/solana, r/ethereum, r/CryptoCurrency)
- Product Hunt
- Hacker News
- Discord communities
- Telegram groups

### 3. جمع‌آوری Feedback

- Google Forms برای feedback
- Discord server برای community
- GitHub Issues برای bugs
- Email: support@suplet.app

---

## 🆘 عیب‌یابی

### مشکل: سایت لود نمی‌شود

```bash
# Check build logs
vercel logs

# Check deployment status
vercel ls
```

### مشکل: Environment variables کار نمی‌کند

1. تأیید کن که در Platform تنظیم شده‌اند
2. Redeploy کن
3. از `VITE_` prefix استفاده کن برای client-side vars

### مشکل: PWA install نمی‌شود

1. تأیید کن HTTPS فعال است
2. Check manifest.json
3. Check service worker در DevTools
4. از Lighthouse PWA audit استفاده کن

### مشکل: APIs کار نمی‌کنند

1. Check API keys در Environment Variables
2. Check network requests در DevTools
3. Test APIs با Postman
4. بررسی CORS settings

---

## ✅ چک‌لیست نهایی قبل از Go Live

- [ ] تمام features تست شده
- [ ] Environment variables تنظیم شده
- [ ] دامنه سفارشی متصل شده (اختیاری)
- [ ] SSL/HTTPS فعال
- [ ] PWA کار می‌کند
- [ ] Error tracking فعال
- [ ] Analytics فعال
- [ ] Security headers تنظیم شده
- [ ] SEO meta tags اضافه شده
- [ ] Backup از کد گرفته شده
- [ ] Documentation آماده
- [ ] Support channel آماده

---

## 🎉 خلاصه - سریع‌ترین روش

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel

# 3. Production
vercel --prod

# 4. Set environment variables در dashboard

# 5. ✅ Done! سایت شما live است!
```

**لینک شما:** `https://your-project.vercel.app`

---

## 📞 نیاز به کمک؟

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Cloudflare Docs: https://developers.cloudflare.com/pages

---

## 🎯 بعدی

بعد از publish:
1. ✅ Share با دوستان
2. ✅ Collect feedback
3. ✅ Monitor performance
4. ✅ Plan next features
5. ✅ Celebrate! 🎊

**موفق باشی! 🚀**
