# Quick Fix: Balance Not Showing

## Problem
You sent coins to your wallet but they don't appear on the Home screen.

## Quick Solution

### 1. Check Network Mode
**Go to: Settings > Developer > Testnet Mode**

Your wallet has TWO modes:
- ✅ **Mainnet**: Real money, real blockchain
- 🧪 **Testnet**: Test tokens, test blockchain

**Common mistake:**
- Your wallet is on Testnet Mode (🧪)
- You sent coins to Mainnet
- Result: Nothing shows because wallet is checking Testnet

**Fix:** Toggle Testnet Mode OFF, then refresh Home.

### 2. Use Balance Checker Tool
**Go to: Settings > Developer > Balance Checker**

1. Click "Check All Balances"
2. Wait for results
3. Check if balance shows here
4. If balance is 0, click "View in Explorer" to verify transaction

### 3. Verify Your Address
In Balance Checker:
1. Copy your address
2. Compare with where you sent coins
3. Make sure they match!

### 4. Check Transaction Status
Click "View in Explorer" button:
- ✅ **Confirmed**: Should appear in wallet (refresh Home)
- ⏳ **Pending**: Wait a few minutes
- ❌ **Failed**: Try sending again

### 5. Refresh Home
- Go to Home page
- Pull down from top (Pull to Refresh)
- Or click Refresh button (top right)

## Network Reference

| Blockchain | Mainnet | Testnet |
|------------|---------|---------|
| Solana | Mainnet-Beta | Devnet |
| Ethereum | Mainnet | Sepolia |
| Bitcoin | Mainnet | Testnet |

**Important:** Same wallet address works on both networks, but they're separate blockchains!

## Still Not Working?

1. Open Developer Console (F12)
2. Look for errors
3. Take screenshot of Balance Checker
4. Share console logs with support

## Get Test Tokens (Testnet Only)

Enable Testnet Mode first, then visit:

**Solana Devnet Faucet**
- https://faucet.solana.com
- Get 1-5 test SOL instantly

**Ethereum Sepolia Faucet**
- https://sepoliafaucet.com
- Get 0.1-0.5 test ETH (1-5 mins)

## Explorer Links

**Solana:**
- Mainnet: https://explorer.solana.com
- Devnet: https://explorer.solana.com?cluster=devnet

**Ethereum:**
- Mainnet: https://etherscan.io
- Sepolia: https://sepolia.etherscan.io

**Bitcoin:**
- Mainnet: https://blockstream.info
- Testnet: https://blockstream.info/testnet
