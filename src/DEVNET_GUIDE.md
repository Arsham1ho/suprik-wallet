# Solana Devnet & Dev Mode Guide

## 🔍 Understanding the Two Testing Methods

Your Saturn wallet has **TWO different ways** to test functionality:

### 1. **Dev Mode** (Simulation - No Blockchain)
- **What it is**: Fake/simulated transactions stored only in the database
- **Use case**: Quick testing without any blockchain interaction
- **How to use**: 
  1. Go to Settings → Enable "Dev Mode"
  2. Click "Test Receive Tokens" button
  3. Select token and amount
  4. Tokens appear instantly (no blockchain involved)
- **Icon**: 🎮 (like a game/simulation)

### 2. **Devnet Mode** (Real Blockchain - Test Network)
- **What it is**: REAL blockchain transactions on Solana's test network
- **Use case**: Testing with real blockchain mechanics (just like mainnet, but free test tokens)
- **How to use**:
  1. Switch Network Selector to "Devnet (Test SOL)" at the top of Home page
  2. Click "Receive" to get your wallet address
  3. Go to https://faucet.solana.com
  4. Paste your address and request devnet SOL
  5. Wait ~30 seconds for blockchain confirmation
  6. Click the refresh button (top right) to check balance
- **Icon**: 🌐 (real blockchain, just test network)

---

## 🚀 Quick Start: Getting Devnet SOL

### Step 1: Switch to Devnet Network
1. Open your Saturn wallet
2. On the Home page, look for the **"Solana Network"** selector card (purple background)
3. Click the dropdown and select **"Devnet (Test SOL)"**
4. The wallet will automatically refresh to check devnet balances

### Step 2: Get Your Wallet Address
1. Click the **"Receive"** button (grid icon)
2. Copy your Solana address (starts with a long string of letters/numbers)
3. Keep this dialog open or save the address somewhere

### Step 3: Request Devnet Tokens
1. Visit **https://faucet.solana.com** in a new tab
2. Paste your wallet address
3. Complete any CAPTCHA if required
4. Click "Request Airdrop" or similar button
5. You can request up to 5 SOL at a time

### Step 4: Check Your Balance
1. Go back to your Saturn wallet
2. Wait about 30 seconds for blockchain confirmation
3. Click the **refresh button** (top right corner, circular arrow icon)
4. Your devnet SOL should appear!

**Note**: The wallet automatically checks for new transactions every 30 seconds, but you can force an immediate check by clicking the refresh button.

---

## ⚙️ Troubleshooting

### "I sent devnet SOL but it's not showing up"

**Checklist**:
1. ✅ Did you switch the Network Selector to "Devnet"? (Not mainnet)
2. ✅ Did you wait at least 30 seconds after the faucet transaction?
3. ✅ Did you click the refresh button (top right)?
4. ✅ Is the Helius API key configured? (Check for blue alert at top of Home page)
5. ✅ Did you use the correct wallet address from the "Receive" dialog?

### "I don't see the Network Selector"

The Network Selector should always be visible at the top of your Home page as a purple card that says "Solana Network". If you don't see it:
- Try refreshing the page
- Check if you're logged in
- Make sure you're on the Home page (not Activity, Swap, or Settings)

### "What's the difference between Dev Mode and Devnet?"

| Feature | Dev Mode | Devnet |
|---------|----------|--------|
| Blockchain | ❌ No blockchain | ✅ Real blockchain |
| Speed | ⚡ Instant | ⏱️ ~30 seconds |
| Transactions | Fake/simulated | Real (but test network) |
| Faucets | Not applicable | ✅ Can use faucets |
| API Keys | Not needed | Helius API key required |
| Purpose | Quick UI testing | Real blockchain testing |

---

## 🔑 API Key Setup (Required for Devnet)

To monitor the Solana devnet blockchain, you need a Helius API key:

1. **Get Free API Key**:
   - Go to https://docs.helius.dev/welcome/what-is-helius
   - Sign up for a free account
   - Create a new project
   - Copy your API key

2. **The app should prompt you** to add the key when needed
   - If not already configured, you'll see a blue alert with setup instructions

3. **Helius API works for both mainnet and devnet** - same key!

---

## 📊 Network Comparison

### Mainnet (Production)
- Real SOL with real value
- Real transactions that cost money
- Use for actual trading/transfers
- **Default network**

### Devnet (Testing)
- Free test SOL with no value
- Real blockchain mechanics
- Use for testing before mainnet
- Can get free tokens from faucets
- **Select in Network Selector**

### Dev Mode (Simulation)
- No blockchain at all
- Instant fake transactions
- Use for UI/feature testing
- **Enable in Settings**

---

## 🎯 Common Use Cases

### "I want to test the wallet without spending money"
→ Use **Devnet Mode** + Solana Faucet

### "I want to quickly test a feature"
→ Use **Dev Mode**

### "I want to use real cryptocurrency"
→ Use **Mainnet** (default) + buy/transfer real crypto

### "I received devnet SOL but it's not showing"
→ Check you're on **Devnet network**, not mainnet, and click refresh

---

## 💡 Tips

1. **Always check your network** before requesting tokens from faucets
2. **Use the refresh button** if you don't see transactions immediately
3. **Dev Mode is instant** - if it takes time, you're using devnet (which is correct for faucets)
4. **Devnet tokens are free and unlimited** - feel free to test as much as you want
5. **Your wallet address is the same** on mainnet and devnet (derived from your seed phrase)
6. **Switching networks doesn't move tokens** - devnet SOL stays on devnet, mainnet SOL stays on mainnet

---

## 🆘 Still Need Help?

If you're still having issues:
1. Check the browser console (F12) for error messages
2. Verify your API keys are configured
3. Make sure you're connected to the internet
4. Try refreshing the entire page
5. Double-check you copied the correct wallet address from the Receive dialog

---

## ✅ Quick Reference

**To use Solana devnet faucet**:
1. Home page → Network Selector → Select "Devnet"
2. Receive button → Copy address
3. Visit https://faucet.solana.com → Request SOL
4. Wait 30 seconds → Click refresh button
5. ✅ Devnet SOL appears!

**To use Dev Mode simulation**:
1. Settings → Enable "Dev Mode"
2. Settings → Click "Test Receive Tokens"
3. Select token and amount
4. ✅ Tokens appear instantly!
