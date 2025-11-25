# ⚡ Quick Swap Guide - Get Started in 30 Seconds

## 🎯 What Changed?

Saturn now supports **REAL Jupiter Swaps** - just like Phantom!

```
Before: ❌ Demo mode only
After:  ✅ Real blockchain swaps
```

## 🚀 Quick Start

### For Testing (Safe, No Real Money)

1. **Enable Testnet Mode:**
   - Go to Settings ⚙️
   - Toggle "Testnet Mode" ON
   
2. **Try a Swap:**
   - Go to Swap tab 🔄
   - Select SOL → USDC
   - Enter 0.1 SOL
   - Click "Swap"
   - Wait 3-5 seconds ⏳
   - See success! ✅

**Result:** Simulated swap, no real money spent

### For Real Swaps (Uses Real Money!)

1. **Make Sure You Have:**
   - At least 0.1 SOL in your wallet
   - Testnet mode is OFF

2. **Perform Swap:**
   - Go to Swap tab 🔄
   - Select SOL → USDC
   - Enter small amount (e.g., 0.01 SOL)
   - Review quote
   - Click "Swap"
   - Wait for confirmation ⏳
   - Copy signature 📋

3. **Verify on Blockchain:**
   - Go to https://solscan.io
   - Paste signature
   - See your REAL transaction! 🎉

## 🔑 Key Features

### ✅ What Works
- Real Jupiter swaps
- Real-time quotes
- Price impact calculation
- Transaction signing (secure, client-side)
- Blockchain confirmation
- Balance updates

### 🛡️ Security
- Private keys NEVER leave your device
- Signing happens locally
- Backend only proxies API calls
- Zero trust architecture

## 📊 How It Works

```
You → Saturn Frontend → Backend Proxy → Jupiter API → Solana Blockchain
                           ↑                              ↓
                      Bypasses CORS              Real transactions
```

## 🎓 Learn More

- **User Guide:** `/HOW_TO_SWAP_FA.md`
- **Technical Details:** `/REAL_SWAP_TECHNICAL.md`
- **Testing Guide:** `/SWAP_TESTING_GUIDE_FA.md`
- **Full Implementation:** `/REAL_SWAP_IMPLEMENTATION_FA.md`

## 💡 Pro Tips

1. **Always start with Testnet** to learn how it works
2. **Use small amounts** first in Mainnet (0.01 SOL)
3. **Check slippage** settings before swapping
4. **Save the signature** to verify on blockchain explorer
5. **Keep 0.01 SOL** in wallet for transaction fees

## ⚠️ Common Issues

**"Insufficient balance"**
→ Keep at least 0.01 SOL for fees

**"No quote available"**
→ Token not supported or low liquidity

**"Transaction failed"**
→ Increase slippage or try again

**"Swap taking too long"**
→ Network might be congested, wait or try later

## 🎯 Quick Comparison

| Feature | Before | Now |
|---------|--------|-----|
| Real Swaps | ❌ | ✅ |
| Jupiter API | ❌ Blocked | ✅ Working |
| Fallback | ❌ | ✅ 3-tier |
| Speed | 1s (mock) | 2-5s (real) |

## 🎊 You're Ready!

**Testnet Mode:** Practice without risk
**Mainnet Mode:** Real swaps, real blockchain

Start with testnet, then try mainnet with small amounts!

---

Need help? Check the detailed guides above! 🚀
