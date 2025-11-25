# 🚀 Saturn Wallet - Deployment Guide

## Quick Deploy to Vercel (5 Minutes)

### Step 1: Get API Keys

#### Helius (Solana) - FREE
1. Go to https://helius.dev
2. Sign up with GitHub/Google
3. Create new project → Copy API key
4. **Save it**: `HELIUS_API_KEY=dev-xxxxx`

#### Alchemy (Ethereum) - FREE  
1. Go to https://alchemy.com
2. Sign up with email
3. Create new app → Select Ethereum + Sepolia
4. Copy API key from dashboard
5. **Save it**: `ALCHEMY_API_KEY=xxxxx`

### Step 2: Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Click "Deploy" (don't add environment variables yet)

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add these variables:

   ```
   HELIUS_API_KEY=your_helius_key_here
   ALCHEMY_API_KEY=your_alchemy_key_here
   ```

   > ⚠️ **IMPORTANT**: Supabase variables (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) are **auto-configured** by Figma Make. You don't need to add them!

4. **Redeploy**
   - Go to Deployments tab
   - Click "⋮" on latest deployment → "Redeploy"
   - Check "Use existing Build Cache"
   - Click "Redeploy"

### Step 3: Test Your Wallet

1. **Visit your site**: `your-app.vercel.app`

2. **Create a wallet**:
   - Click "Create Wallet"
   - Save your 12-word recovery phrase
   - Set a password

3. **Test Testnet Mode**:
   - Go to Settings → Toggle "Testnet Mode"
   - Get free testnet tokens:
     - Solana: https://faucet.solana.com
     - Ethereum: https://sepoliafaucet.com

4. **Test Mainnet Mode**:
   - Toggle back to Mainnet
   - Your real balances will appear

---

## 🎯 Production Checklist

### Before Going Live

- [ ] **API Keys Configured** (Helius + Alchemy)
- [ ] **Test wallet creation** (12-word phrase)
- [ ] **Test wallet import** (existing phrase)
- [ ] **Test send transaction** (on testnet first!)
- [ ] **Test network switching** (Mainnet ↔ Testnet)
- [ ] **Test on mobile** (iOS Safari + Android Chrome)
- [ ] **Install as PWA** (Add to Home Screen)

### Security Verification

- [ ] **Seed phrases encrypted** - Check localStorage (should be gibberish)
- [ ] **Private keys never visible** - Check Network tab (no private keys)
- [ ] **HTTPS enabled** - Vercel automatically provides SSL
- [ ] **Biometric lock works** - On supported devices
- [ ] **Auto-lock triggers** - After configured timeout

---

## 🔧 Advanced Configuration

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain (e.g., `wallet.yourdomain.com`)
3. Configure DNS (Vercel will guide you)
4. SSL certificate auto-generated

### Fee Collection (Optional)

If you want to collect small fees from swaps:

1. Get your Solana wallet address
2. Add to Vercel environment variables:
   ```
   APP_FEE_WALLET=your_solana_address_here
   ```
3. Fees will be collected automatically on swaps

### Analytics (Optional)

Add Vercel Analytics for user insights:

1. Go to Project Settings → Analytics
2. Enable Vercel Analytics
3. View real-time user data in dashboard

---

## 🔍 Troubleshooting

### "Failed to fetch Solana balance"

**Problem**: Helius API key not configured or invalid

**Solution**:
1. Check environment variable: `HELIUS_API_KEY`
2. Verify key is valid at https://helius.dev
3. Redeploy after adding/fixing key

### "Failed to fetch Ethereum balance"

**Problem**: Alchemy API key not configured or invalid

**Solution**:
1. Check environment variable: `ALCHEMY_API_KEY`
2. Verify key is valid at https://alchemy.com
3. Make sure you created app for both Mainnet AND Sepolia

### "No testnet tokens"

**Problem**: New wallet in testnet mode has no balance

**Solution**:
1. Get your wallet address (click "Receive")
2. Visit faucets:
   - Solana: https://faucet.solana.com
   - Ethereum: https://sepoliafaucet.com
3. Request testnet tokens (free!)
4. Wait 30 seconds, refresh wallet

### PWA won't install

**Problem**: "Add to Home Screen" not appearing

**Solution**:
- **iOS**: Must use Safari (not Chrome)
- **Android**: Must use Chrome (not Firefox)
- **Desktop**: Chrome/Edge will show install prompt
- Make sure site is loaded via HTTPS

---

## 📱 Mobile Testing

### iOS (Safari)

1. Open wallet in Safari
2. Tap Share button (square with arrow)
3. Tap "Add to Home Screen"
4. Open from home screen (full-screen mode)
5. Test biometric lock (Face ID/Touch ID)

### Android (Chrome)

1. Open wallet in Chrome
2. Tap menu (⋮) → "Add to Home screen"
3. Open from home screen
4. Test biometric lock (Fingerprint)

---

## 🌐 Alternative Deployments

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Add environment variables in Netlify dashboard
# Deploy
netlify deploy --prod
```

### Cloudflare Pages

1. Go to Cloudflare dashboard
2. Pages → Create project
3. Connect GitHub repository
4. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
5. Add environment variables
6. Deploy

---

## 🔒 Security Best Practices

### For Production

1. **Never commit API keys** - Use environment variables only
2. **Enable HTTPS** - Vercel/Netlify do this automatically
3. **Monitor error logs** - Check Vercel dashboard regularly
4. **Keep dependencies updated** - Run `npm audit` monthly
5. **Test on testnet first** - Before mainnet transactions

### For Users

1. **Backup recovery phrase** - Write it down physically
2. **Never share phrase** - Support will NEVER ask for it
3. **Use strong password** - Minimum 8 characters
4. **Enable biometric lock** - Extra security layer
5. **Test with small amounts** - Before large transactions

---

## 📊 Monitoring

### Vercel Analytics

- View in Vercel dashboard
- Real-time visitors
- Top pages
- Device types
- Geographic data

### Error Tracking

All errors are logged with context:

```
[Home] ✅ Wallet info loaded from localStorage
[Blockchain] 🔗 Fetching balances from blockchain APIs
[Transaction] ❌ Error: Insufficient balance
```

Check browser console for detailed logs.

### Performance

- Lighthouse score: Aim for 90+
- First load: < 3 seconds
- Balance fetch: < 2 seconds
- Transaction signing: Instant

---

## 🆘 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Wallet won't unlock | Clear browser cache, re-import with phrase |
| Balance not updating | Click refresh button, check API keys |
| Transaction failing | Check network status, try lower amount |
| PWA won't install | Use correct browser (Safari/Chrome) |

### Need Help?

- **Documentation**: Check README.md
- **Checklist**: See PRODUCTION_CHECKLIST.md
- **GitHub Issues**: Report bugs
- **Community**: Join Discord

---

## 🎉 You're Live!

Congratulations! Your Saturn Wallet is now deployed and ready for users.

**Next Steps**:

1. Share your wallet URL with friends
2. Monitor usage in Vercel dashboard
3. Join our community for updates
4. Consider contributing to the project

**Remember**:
- Start users on Testnet for safety
- Provide clear instructions
- Monitor for errors
- Collect feedback

---

<div align="center">

**Built with 💜 using Figma Make**

[Vercel](https://vercel.com) • [Helius](https://helius.dev) • [Alchemy](https://alchemy.com)

</div>
