# 🔑 Helius API Key Setup - Saturn Wallet

## 📋 New Helius Configuration

**API Key**: `e7ec6503-c9b2-4c0b-ae5f-3646622d4896`

### 🌐 RPC Endpoints

#### Mainnet
```
https://mainnet.helius-rpc.com/?api-key=e7ec6503-c9b2-4c0b-ae5f-3646622d4896
```

#### Devnet (Testnet)
```
https://devnet.helius-rpc.com/?api-key=e7ec6503-c9b2-4c0b-ae5f-3646622d4896
```

---

## ✅ Setup Complete

The Helius API key has been added to your Supabase secrets as `HELIUS_API_KEY`.

### How It Works

The server automatically constructs the correct RPC URL based on the network mode:

```typescript
// Server code (already implemented)
const HELIUS_API_KEY = Deno.env.get('HELIUS_API_KEY');

// Mainnet
const mainnetUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Devnet
const devnetUrl = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
```

---

## 🧪 Testing Your API Key

### 1. Quick Test via Terminal

```bash
curl https://mainnet.helius-rpc.com/?api-key=e7ec6503-c9b2-4c0b-ae5f-3646622d4896 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getHealth"
  }'
```

**Expected Response**:
```json
{
  "jsonrpc": "2.0",
  "result": "ok",
  "id": 1
}
```

### 2. Test in Saturn Wallet

1. Open your Saturn Wallet
2. Create or unlock a wallet
3. Check the console - you should see:
   ```
   [Solana] 🔗 Fetching balance from MAINNET for...
   [Solana] ✅ MAINNET Balance: X.XXXXXX SOL
   ```

### 3. Check API Status

Open browser console and run:
```javascript
fetch('https://YOUR_PROJECT.supabase.co/functions/v1/make-server-e5bc10d1/api-status')
  .then(r => r.json())
  .then(console.log)

// Expected: { helius: true, alchemy: true }
```

---

## 📊 Helius API Features

### Available RPC Methods

| Method | Purpose | Used By |
|--------|---------|---------|
| `getBalance` | Get SOL balance | ✅ Home page |
| `getTokenAccountsByOwner` | Get SPL tokens | ✅ Home page |
| `getAsset` (DAS API) | Token metadata | ✅ Token display |
| `getSignaturesForAddress` | Transaction history | ✅ Activity page |
| `sendTransaction` | Send SOL/tokens | ✅ Send page |
| `getTransaction` | Transaction details | ✅ Activity page |
| `getRecentBlockhash` | For signing | ✅ Send page |

### Rate Limits (Free Tier)

- **Requests per second**: 100
- **Requests per day**: Unlimited
- **WebSocket connections**: 10
- **Rate limit response**: 429 Too Many Requests

### Upgrade Options

If you need more:
- **Developer**: 1000 RPS, $99/month
- **Professional**: 2500 RPS, $249/month
- **Enterprise**: Custom, contact sales

---

## 🎯 Current Usage

Saturn Wallet uses Helius for:

### 1. Balance Fetching (Every 10 seconds)
```typescript
// Automatic refresh like Phantom
setInterval(() => {
  fetchSolanaBalance(address, 'mainnet');
}, 10000);
```

### 2. Token Discovery
```typescript
// Finds all SPL tokens in wallet
getTokenAccountsByOwner(address, {
  programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
})
```

### 3. Token Metadata
```typescript
// Gets token name, symbol, logo via DAS API
getAsset({ id: mintAddress })
```

### 4. Transaction History
```typescript
// Last 10 transactions
getSignaturesForAddress(address, { limit: 10 })
```

---

## 🔐 Security Best Practices

### ✅ DO:
- ✅ Store API key in Supabase secrets (already done)
- ✅ Use server-side only (already implemented)
- ✅ Monitor usage in Helius dashboard
- ✅ Rotate key if exposed

### ❌ DON'T:
- ❌ Commit API key to Git
- ❌ Expose in frontend code
- ❌ Share publicly
- ❌ Use in client-side requests

---

## 📈 Monitoring Usage

### Helius Dashboard
1. Go to: https://dashboard.helius.dev
2. Login with your account
3. View:
   - Requests per second
   - Daily usage
   - Error rates
   - Top methods called

### Saturn Wallet Logs

Check browser console for:
```
[Solana] 🔗 Fetching balance from MAINNET...
[Solana] ✅ MAINNET Balance: 1.234567 SOL
[Solana] ✅ Found 5 SPL tokens
```

Check server logs for:
```
POST /make-server-e5bc10d1/solana-balance
Status: 200
Response time: 450ms
```

---

## 🛠️ Troubleshooting

### Error: "HELIUS_API_KEY not configured"

**Solution**: Make sure you entered the API key in the Supabase secret modal that appeared.

### Error: 429 Too Many Requests

**Cause**: Exceeded 100 requests/second rate limit.

**Solutions**:
1. Increase refresh interval (currently 10s)
2. Add request queuing
3. Upgrade to Developer tier

### Error: "Invalid API key"

**Check**:
1. API key is correct: `e7ec6503-c9b2-4c0b-ae5f-3646622d4896`
2. No extra spaces in Supabase secret
3. Key is active in Helius dashboard

### No Balance Showing

**Debug steps**:
1. Open browser console
2. Look for Solana logs
3. Check network tab for failed requests
4. Verify wallet address is correct

---

## 🎉 What's Working Now

With this Helius API key, your Saturn Wallet can:

✅ **Fetch SOL Balance**
- Real-time mainnet balance
- Devnet balance for testing

✅ **Display SPL Tokens**
- USDC, USDT, and all SPL tokens
- Token logos and metadata
- Real-time prices

✅ **Transaction History**
- Last 10 transactions
- Send/receive details
- Transaction status

✅ **Send Transactions**
- Send SOL
- Send SPL tokens
- Transaction signing

✅ **Swap Tokens**
- Jupiter integration
- Real-time quotes
- Actual swaps on mainnet

---

## 📞 Support

### Helius Support
- Dashboard: https://dashboard.helius.dev
- Docs: https://docs.helius.dev
- Discord: https://discord.gg/helius

### Saturn Wallet Issues
- Check `/TROUBLESHOOTING.md`
- Review console logs
- Test with devnet first

---

## 🚀 Next Steps

### Immediate (Now Working)
1. ✅ Mainnet SOL balance
2. ✅ SPL token display
3. ✅ Send/receive
4. ✅ Transaction history
5. ✅ Jupiter swaps

### Coming Soon (When Enabled)
1. 🔄 Bitcoin support
2. 🔄 Ethereum support
3. 🔄 Multi-chain swaps

---

**API Key**: `e7ec6503-c9b2-4c0b-ae5f-3646622d4896`  
**Network**: Solana Mainnet & Devnet  
**Provider**: Helius  
**Status**: ✅ Active  
**Last Updated**: November 17, 2024
