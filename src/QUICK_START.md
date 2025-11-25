# ⚡ Saturn Wallet - Quick Start Guide (5 Minutes)

## 🎯 Goal

Get Saturn Wallet running locally in 5 minutes!

---

## 📋 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org)
- **Git** - [Download here](https://git-scm.com)

Check if you have them:
```bash
node --version  # Should show v18 or higher
git --version   # Should show git version
```

---

## 🚀 Installation (2 Minutes)

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/saturn-wallet.git
cd saturn-wallet

# Install dependencies
npm install
```

### Step 2: Get API Keys (FREE)

#### Helius (Solana) - 30 seconds

1. Go to https://helius.dev
2. Click "Sign Up" (use GitHub for fastest)
3. Create new project → Copy API key
4. Save it somewhere

#### Alchemy (Ethereum) - 30 seconds

1. Go to https://alchemy.com
2. Sign up with email
3. Create new app:
   - Chain: **Ethereum**
   - Network: **Mainnet** (we'll add Sepolia later)
4. Copy API key from dashboard
5. Create another app for **Sepolia** testnet (same API key works!)

### Step 3: Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit .env file and add your keys
nano .env  # or use any text editor
```

Add these lines:
```bash
HELIUS_API_KEY=your_helius_key_here
ALCHEMY_API_KEY=your_alchemy_key_here
```

Save and close!

### Step 4: Run!

```bash
npm run dev
```

Open browser: **http://localhost:3000**

🎉 **Done!** You should see Saturn Wallet running!

---

## ✅ First Steps

### 1. Create Your First Wallet

1. Click **"Create Wallet"**
2. **SAVE YOUR 12-WORD PHRASE** ✍️
   - Write it down on paper
   - NEVER share it
   - You'll need it to restore your wallet
3. Set a password
4. Done! 🎊

### 2. Switch to Testnet Mode

**IMPORTANT**: Always test on testnet first!

1. Click ⚙️ **Settings** (bottom navigation)
2. Toggle **"Network Mode"** → Testnet
3. You'll see: "You are in Testnet" ⚠️

### 3. Get Free Testnet Tokens

#### Get Solana (Devnet)
1. Click **"Receive"**
2. Copy your Solana address
3. Visit: https://faucet.solana.com
4. Paste address → Request airdrop
5. Wait 30 seconds → Refresh wallet ✅

#### Get Ethereum (Sepolia)
1. Copy your Ethereum address (same Receive dialog)
2. Visit: https://sepoliafaucet.com
3. Paste address → Request faucet
4. Wait 1-2 minutes → Refresh wallet ✅

### 4. Test Sending

1. Click **"Send"**
2. Enter a friend's address (or your other wallet)
3. Enter amount (try 0.1 SOL or 0.01 ETH)
4. Click **"Send"**
5. Confirm transaction ✅

**Success!** 🎉 You just sent your first testnet transaction!

### 5. Switch to Mainnet (When Ready)

**⚠️ CAUTION**: This is REAL money!

1. Settings → Toggle "Network Mode" → Mainnet
2. Your REAL balances will appear
3. Start with small amounts to test
4. Always double-check addresses!

---

## 🎨 Customize Your Wallet

### Change Theme

1. Settings → Appearance
2. Choose your favorite gradient:
   - Purple (default)
   - Blue
   - Pink
   - Green
   - Orange

### Set Profile Picture

1. Settings → Profile
2. Upload or take a photo
3. Or choose an animal avatar!

### Change Language

1. Settings → Language
2. Choose: English / فارسی (Farsi)

---

## 🔒 Security Tips

### Essential

✅ **DO**:
- Write down your recovery phrase on paper
- Store it in a safe place (not on computer!)
- Use a strong password (8+ characters)
- Enable biometric lock (Face ID/Fingerprint)
- Test on testnet before mainnet

❌ **DON'T**:
- Share your recovery phrase with ANYONE
- Screenshot your recovery phrase
- Store phrase in cloud/email
- Send large amounts without testing first
- Trust anyone asking for your phrase

### Enable Auto-Lock

1. Settings → Security
2. Enable "Biometric Lock"
3. Set auto-lock timeout (5 min recommended)
4. Now your wallet locks automatically! 🔐

---

## 📱 Install as Mobile App

### iOS (Safari)

1. Open wallet in Safari
2. Tap **Share** button (square with arrow ↑)
3. Scroll → Tap **"Add to Home Screen"**
4. Tap **"Add"**
5. Open from home screen (full screen!) 📱

### Android (Chrome)

1. Open wallet in Chrome
2. Tap **menu (⋮)**
3. Tap **"Add to Home screen"**
4. Tap **"Add"**
5. Open from home screen 📱

---

## 🐛 Common Issues

### "Failed to fetch balance"

**Problem**: API keys not configured

**Fix**:
```bash
# Check .env file has both keys:
HELIUS_API_KEY=xxx
ALCHEMY_API_KEY=xxx

# Restart dev server:
npm run dev
```

### "No tokens in wallet"

**Problem**: You're in testnet with no tokens

**Fix**:
1. Get free tokens from faucets (see above)
2. OR switch to mainnet in Settings

### "Transaction failed"

**Problem**: Insufficient balance or network issue

**Fix**:
1. Check you have enough balance
2. Try a smaller amount
3. Wait a minute and retry
4. Check network status

---

## 🚀 Deploy to Production

Ready to share your wallet?

### Deploy to Vercel (Free)

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push

# 2. Visit vercel.com
# 3. Import your GitHub repo
# 4. Add environment variables (same as .env)
# 5. Deploy!
```

See full guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 📚 Learn More

- **README.md** - Full feature list
- **PRODUCTION_CHECKLIST.md** - Pre-launch checklist
- **DEPLOYMENT_GUIDE.md** - Detailed deployment steps

---

## 🆘 Need Help?

- **GitHub Issues** - Report bugs
- **Discussions** - Ask questions
- **Documentation** - README.md

---

## 🎉 You're Ready!

You now have:
- ✅ Working wallet locally
- ✅ Testnet configured
- ✅ Security basics understood
- ✅ Ready to deploy

**Next**: Explore features, test transactions, customize your wallet!

---

<div align="center">

**Welcome to Saturn Wallet! 🪐💜**

*The most beautiful crypto wallet for Web3*

</div>
