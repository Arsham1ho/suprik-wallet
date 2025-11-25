# 🔧 Fix: Parabolic AI Tokens Not Showing

## Problem
You sent Parabolic AI (PARAI) tokens to your wallet, but they're not showing up in the wallet.

---

## ✅ Quick Solution

### Step 1: Check Your Network Mode
The most common issue is being on the wrong network!

1. Open Saturn Wallet
2. Go to **Settings** → **Developer**
3. Check **Network Mode**:
   - If **Testnet Mode is ON** → You can only see testnet tokens
   - If **Testnet Mode is OFF** → You can only see mainnet tokens

**Important**: Parabolic AI tokens on **Solana Mainnet** will only show when Testnet Mode is **OFF**.

---

## 🔍 Step 2: Use Balance Checker Tool

The wallet has a built-in debugging tool to check your real blockchain balances:

1. Go to **Settings** → **Developer** → **Balance Checker**
2. This will show you:
   - ✅ Your exact Solana address
   - ✅ All tokens on Solana Mainnet
   - ✅ All tokens on Solana Devnet (if in testnet)
   - ✅ Direct link to Solana Explorer

3. Click **"View on Solana Explorer"** to see your tokens on the blockchain

---

## 📊 Step 3: Verify Token Was Received

### Option A: Use Balance Checker (Easiest)
In **Settings → Developer → Balance Checker**, you'll see a detailed breakdown of ALL your tokens.

### Option B: Use Solana Explorer
1. Copy your Solana address from Balance Checker
2. Go to https://explorer.solana.com
3. Paste your address
4. Check the **"Tokens"** tab
5. Look for Parabolic AI tokens

---

## 🔄 Step 4: Refresh Your Wallet

The wallet auto-refreshes every 10 seconds, but you can force a refresh:

1. Go to **Home** screen
2. Click the **refresh icon** (circular arrow) in the top right
3. Wait 5-10 seconds for the blockchain to be queried

---

## 🧪 Common Issues & Solutions

### Issue 1: Wrong Network
**Problem**: Testnet mode is ON, but you received mainnet tokens
**Solution**: 
```
Settings → Developer → Testnet Mode → Turn OFF
```

### Issue 2: Token Just Sent (Needs Confirmation)
**Problem**: Transaction is still being confirmed on blockchain
**Solution**: 
- Wait 30-60 seconds for blockchain confirmation
- Check Solana Explorer with your transaction signature
- Use the refresh button

### Issue 3: API Keys Not Configured
**Problem**: HELIUS_API_KEY is missing
**Solution**:
```
Settings → Developer → API Keys → Add Helius API Key
```

### Issue 4: Token Mint Address Not Recognized
**Problem**: The token has a custom mint address
**Solution**: The wallet fetches ALL SPL tokens automatically, including custom tokens

---

## 🔬 Technical Details

### How Token Detection Works

The Saturn Wallet uses **real blockchain queries** to detect tokens:

```typescript
// Backend queries Solana blockchain
getTokenAccountsByOwner(
  address,
  { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }
)
```

This returns **ALL SPL tokens** in your wallet, including:
- ✅ Parabolic AI (PARAI)
- ✅ USDC, USDT
- ✅ Any custom SPL token

### Token Metadata Fetching

For each token found, the wallet fetches metadata:

```typescript
// Get token name, symbol, logo
getAsset({ id: tokenMintAddress })
```

This is done via **Helius RPC API**, which is why you need the API key configured.

---

## 🛠️ Advanced Debugging

### Check Console Logs

1. Open Browser DevTools (F12)
2. Go to **Console** tab
3. Look for these messages:

**Good signs:**
```
[Solana] ✅ MAINNET Balance: 0.5 SOL
[Solana] Found 3 token accounts on MAINNET
[Solana] Found 2 tokens with balance on MAINNET
[Home] ✅ Loaded 5 tokens
```

**Bad signs:**
```
[Solana] ❌ HELIUS_API_KEY not configured
[Blockchain] ❌ Error fetching Solana balance
```

### Manual Blockchain Check

If the wallet still doesn't show tokens, verify directly on blockchain:

**For Solana Mainnet:**
1. Get your address from Balance Checker
2. Visit: `https://explorer.solana.com/address/YOUR_ADDRESS`
3. Click **Tokens** tab
4. Verify Parabolic AI tokens are there

**For Solana Devnet (Testnet):**
1. Visit: `https://explorer.solana.com/address/YOUR_ADDRESS?cluster=devnet`

---

## 📝 Checklist

Use this checklist to troubleshoot:

- [ ] **Network Mode**: Testnet OFF for mainnet tokens
- [ ] **API Keys**: Helius API key is configured
- [ ] **Wait Time**: Waited at least 1 minute after sending
- [ ] **Balance Checker**: Checked with the built-in tool
- [ ] **Explorer**: Verified tokens exist on Solana Explorer
- [ ] **Refresh**: Used the refresh button
- [ ] **Console**: Checked browser console for errors

---

## 🆘 Still Not Working?

If you've tried all the above and tokens still don't show:

### 1. Verify Transaction Signature
Check the transaction that sent you the tokens:
```
https://explorer.solana.com/tx/YOUR_TRANSACTION_SIGNATURE
```

### 2. Check Token Mint Address
The real Parabolic AI token has a specific mint address. Make sure the sender used the correct token.

### 3. Force Reload
```
1. Settings → Developer → Clear Cache (if available)
2. Refresh browser (Ctrl+R)
3. Wait 30 seconds
4. Check again
```

### 4. Check Wallet Address
Make sure you're checking the same wallet that received the tokens:
```
1. Settings → Security → Show Recovery Phrase
2. Verify this matches the wallet that received tokens
```

---

## 🎯 Expected Behavior

### When tokens show correctly:

**Mainnet Mode (Testnet OFF):**
```
🏠 Home Screen:
├─ Parabolic AI (PARAI): 1000 tokens
├─ Solana (SOL): 0.5 SOL
├─ Ethereum (ETH): 0.1 ETH
└─ Other SPL tokens...
```

**Testnet Mode (Testnet ON):**
```
🏠 Home Screen:
├─ Solana (SOL): 5.0 SOL (devnet)
├─ Parabolic AI (PARAI): Only if you have devnet PARAI
└─ Other devnet tokens...
```

---

## 📚 Related Documentation

- `BALANCE_NOT_SHOWING_FA.md` - Complete balance troubleshooting guide (Persian)
- `STEP_BY_STEP_TESTING_FA.md` - Step-by-step testing guide (Persian)
- `SATURN_VS_PHANTOM_FA.md` - How Saturn wallet works (Persian)

---

## ✅ Summary

**Most common fix**: Turn OFF Testnet Mode

```
Settings → Developer → Testnet Mode → OFF → Refresh
```

**If that doesn't work**: Use the Balance Checker tool to see exactly what's on the blockchain.

The wallet fetches ALL SPL tokens automatically - there's no manual "add token" needed like in some wallets. If it's on your blockchain address, it will show up!

---

**Need help?** Check the browser console (F12) for detailed error messages, or use the Balance Checker tool to see raw blockchain data.
