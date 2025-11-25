# 🚀 Suplet Wallet - Quick Publish Guide

## Fastest Way to Publish Your App

---

## ⚡ 5-Minute Deploy (Recommended: Vercel)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login
```bash
vercel login
```

### Step 3: Deploy
```bash
# Test deployment
vercel

# Production deployment
vercel --prod
```

### Step 4: Configure Environment Variables

Go to your Vercel Dashboard:
1. Select your project
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

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

4. Click **Save**
5. Redeploy from Deployments tab

### Step 5: ✅ Done!

Your app is live at: `https://your-project.vercel.app`

---

## 🌐 Alternative: Deploy via GitHub

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Suplet Wallet"

# Create new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/suplet-wallet.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"New Project"**
4. Import your GitHub repository
5. Click **"Deploy"**

Vercel will automatically:
- ✅ Detect React/Vite settings
- ✅ Build your app
- ✅ Deploy to production

### Step 3: Add Environment Variables

Same as above - in Project Settings → Environment Variables

---

## 🎯 Other Deployment Options

### Option A: Netlify

```bash
# Install CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

Then add environment variables in Netlify Dashboard.

### Option B: Cloudflare Pages

1. Go to https://pages.cloudflare.com
2. Connect GitHub repository
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy

---

## 🔧 Build Configuration

Your app uses **Vite**, so build settings are:

- **Build Command:** `npm run build` or `vite build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Node Version:** 18.x or higher

---

## 📱 Custom Domain (Optional)

### After deployment, add your domain:

**In Vercel:**
1. Project Settings → Domains
2. Add domain: `suplet.app`
3. Update DNS at your domain provider:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Wait 5-60 minutes for DNS propagation.

---

## ✅ Post-Deployment Checklist

Test your live site:

- [ ] Site loads correctly
- [ ] Create new wallet works
- [ ] Send/Receive works (use Devnet first)
- [ ] Swap functionality works
- [ ] PWA install prompt appears
- [ ] Mobile responsive
- [ ] No console errors
- [ ] SSL/HTTPS enabled
- [ ] All environment variables working

---

## 🐛 Troubleshooting

### Issue: Build fails

**Check:**
- Node version (should be 18+)
- Dependencies installed correctly
- No TypeScript errors

**Fix:**
```bash
npm install
npm run build
```

### Issue: Environment variables not working

**Fix:**
1. Ensure they're added in dashboard (not in code)
2. Redeploy after adding variables
3. Check variable names match exactly

### Issue: PWA doesn't work

**Check:**
- HTTPS is enabled (automatic on Vercel/Netlify)
- Service worker file exists: `/public/sw.js`
- Manifest file exists: `/public/manifest.json`

### Issue: APIs failing

**Check:**
- API keys are correct
- API keys have proper permissions
- CORS settings allow your domain

---

## 📊 Add Analytics (Optional)

### Vercel Analytics (Easiest)

```bash
npm install @vercel/analytics
```

```tsx
// In App.tsx
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      {/* Your app components */}
      <Analytics />
    </>
  );
}
```

---

## 🚀 Performance Tips

After deployment:

1. **Test with Lighthouse:**
   - Open Chrome DevTools
   - Go to Lighthouse tab
   - Run audit
   - Aim for 90+ score

2. **Monitor:**
   - Check Vercel Analytics
   - Watch error logs
   - Monitor API usage

3. **Optimize:**
   - Compress images
   - Enable caching
   - Use CDN for assets

---

## 📢 Share Your App

After going live, announce on:

- **Twitter/X** (#Crypto #Web3 #Solana)
- **Reddit** (r/solana, r/ethereum)
- **Product Hunt**
- **Discord communities**
- **LinkedIn**

**Template:**
```
🚀 Just launched Suplet Wallet!

A friendly crypto wallet with:
✨ Multi-chain support
🔒 Your keys, your crypto
⚡ Lightning-fast swaps
🎨 Beautiful design

Try it: https://suplet.app

#Crypto #Web3 #DeFi
```

---

## 🎉 You're Live!

**Your app is now accessible to the world!** 🌍

**Next steps:**
1. Share with users
2. Collect feedback
3. Monitor performance
4. Plan next features

**Congratulations! 🎊**

---

## 📞 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com
- **Support:** Check `/HOW_TO_PUBLISH.md` for detailed guide

---

## 💡 Pro Tips

1. **Use Vercel** - Best for React apps, free tier is generous
2. **Always test** on Devnet before Mainnet
3. **Monitor errors** - Set up error tracking
4. **Get feedback early** - Share with small group first
5. **Update regularly** - Keep dependencies updated

---

**Ready? Let's publish!** 🚀

```bash
vercel --prod
```

**That's it!** Your Suplet Wallet is live! 🎊
