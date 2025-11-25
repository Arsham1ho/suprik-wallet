# 🔍 Token Display Troubleshooting Guide

## 🎯 Issue: Sent tokens (like PUMP and PAI) are not showing in wallet

### Debugging Steps:

## 1️⃣ Check Browser Console

Open Developer Tools (F12) and look for these logs:

### A) Blockchain Token Fetch Logs

```
[Blockchain] 🔄 Fetching balances for Solana network only...
[Solana] 🔗 Fetching balance from MAINNET for XXXXXXXX...
[Solana] ✅ MAINNET Balance: X.XXXXXX SOL
[Solana] ✅ Found X SPL tokens
```

**What to check**: Number of SPL tokens found

### B) TokenLoader Logs

```
[TokenLoader] 🚀 Loading tokens in mainnet mode...
[TokenLoader] 📊 Blockchain data received:
  - SOL balance: X.XXXX
  - SPL tokens: X
```

**What to check**: Is the SPL token count correct?

### C) Detailed Token Logs

```
[TokenLoader] 🎯 Auto-adding X SPL tokens...
[TokenLoader] 📋 SPL tokens from blockchain: [
  {symbol: "USDC", name: "USD Coin", amount: 100, mint: "EPjF..."},
  {symbol: "PUMP", name: "Pump Token", amount: 50, mint: "xyz..."},
  {symbol: "PAI", name: "PAI Token", amount: 25, mint: "abc..."}
]
```

**What to check**: Are PUMP and PAI in this list?

### D) Token Addition Logs

```
[TokenLoader] ✅ Adding token #1: {symbol: "USDC", name: "USD Coin", amount: 100, mint: "...", logoUrl: "..."}
[TokenLoader] ✅ Adding token #2: {symbol: "PUMP", name: "Pump Token", amount: 50, mint: "...", logoUrl: "..."}
[TokenLoader] ✅ Adding token #3: {symbol: "PAI", name: "PAI Token", amount: 25, mint: "...", logoUrl: "..."}
```

**What to check**: Are your tokens being added to the final list?

---

## 2️⃣ Check Server Logs

In Supabase Edge Functions panel, check server logs:

### A) Token Account Logs

```
[Solana] Found 5 token accounts on MAINNET
[Solana] Token account #1: mint=EPjFWdd5..., amount=100
[Solana] Token account #2: mint=xyzABC12..., amount=50
[Solana] Token account #3: mint=abcDEF34..., amount=25
```

**What to check**: 
- Is the token account count correct?
- Is your token's mint address in the list?
- Is amount > 0?

### B) Metadata Logs

```
[Solana] ✅ Metadata for EPjFWdd5...: USDC (USD Coin), logo=Yes
[Solana] ✅ Metadata for xyzABC12...: PUMP (Pump Token), logo=Yes
[Solana] ✅ Metadata for abcDEF34...: PAI (PAI Token), logo=No
```

Or if there's an error:

```
[Solana] ⚠️ No metadata result for xyzABC12...
[Solana] Could not fetch metadata for abcDEF34...: Error message
```

**What to check**:
- Is metadata being fetched successfully?
- Are symbol and name correct?

---

## 3️⃣ Common Issue Scenarios

### 🔴 Scenario 1: Token not in server logs

**Cause**: Transaction not confirmed yet or sent to wrong address

**Solution**:
1. Check your address in Solana Explorer: `https://explorer.solana.com/address/YOUR_ADDRESS`
2. See if token is in Token Accounts list
3. If not, check transaction - may have been sent to different address

### 🟡 Scenario 2: Token in server logs but amount = 0

**Cause**: Token balance is 0 (likely transferred out completely)

**Solution**:
1. Check balance in Solana Explorer
2. If amount is actually > 0 but showing 0, may be decimals issue
3. Check: what is `uiAmount` in RPC response?

### 🟢 Scenario 3: Token in server logs with amount > 0 but metadata not fetched

**Cause**: Helius DAS API doesn't have metadata for this token

**Solution**:
This should NOT prevent token from showing! Token should display with:
- Symbol: "TOKEN" (default)
- Name: "Unknown Token"
- Logo: First letter of symbol (e.g., "T")

If it's not showing, there's a bug in the code that needs fixing.

### 🔵 Scenario 4: Token in blockchain data but filtered by TokenLoader

**Cause**: `amount > 0 || !isTestnet` condition in tokenLoader

**Solution**:
1. Check that you're in Mainnet mode (not Testnet)
2. If in Testnet, only tokens with `amount > 0` are shown

### 🟣 Scenario 5: Token added to tokens array but not showing in UI

**Cause**: React rendering issue

**Solution**:
1. In Console type: `console.log(tokens)`
2. Is the token in the tokens array?
3. If yes, issue is in component rendering - check that component is designed to render all tokens

---

## 4️⃣ Manual Testing

### Test with Solana Explorer

1. Go to: `https://explorer.solana.com/address/YOUR_SOLANA_ADDRESS`
2. Open "Tokens" tab
3. See list of all Token Accounts
4. For each token, note Mint Address and Balance

### Test with Helius RPC directly

Run this code in browser Console:

```javascript
const address = "YOUR_SOLANA_ADDRESS";
const apiKey = "e7ec6503-c9b2-4c0b-ae5f-3646622d4896";

// Get token accounts
fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getTokenAccountsByOwner',
    params: [
      address,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding: 'jsonParsed' }
    ]
  })
})
.then(r => r.json())
.then(data => {
  console.log('Token Accounts:', data.result.value.length);
  data.result.value.forEach((acc, i) => {
    const info = acc.account.data.parsed.info;
    console.log(`Token #${i + 1}:`, {
      mint: info.mint,
      amount: info.tokenAmount.uiAmount,
      decimals: info.tokenAmount.decimals
    });
  });
})
```

### Test metadata for specific token

```javascript
const mintAddress = "YOUR_TOKEN_MINT_ADDRESS"; // e.g., PUMP or PAI
const apiKey = "e7ec6503-c9b2-4c0b-ae5f-3646622d4896";

fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getAsset',
    params: { id: mintAddress }
  })
})
.then(r => r.json())
.then(data => {
  console.log('Token Metadata:', {
    name: data.result?.content?.metadata?.name,
    symbol: data.result?.content?.metadata?.symbol,
    logo: data.result?.content?.links?.image
  });
})
```

---

## 5️⃣ Quick Fixes

### Fix 1: Force Refresh

On Home page, click Refresh button or:

```javascript
// In Console
window.location.reload();
```

### Fix 2: Clear Cache

```javascript
// Clear token cache
localStorage.removeItem('token_logos_cache');
window.location.reload();
```

### Fix 3: Check Network Mode

In Settings make sure you're in the right mode:
- **Mainnet**: All tokens shown (even with 0 balance)
- **Testnet/Devnet**: Only tokens with balance > 0

---

## 6️⃣ Final Checklist

Before reporting a bug, check these:

- [ ] Is the token send transaction confirmed?
- [ ] Was it sent to the correct Solana address?
- [ ] Is the token visible in Solana Explorer?
- [ ] Are you in Mainnet mode? (not Testnet)
- [ ] Have you hit Refresh?
- [ ] Have you checked Console logs?
- [ ] Have you checked Server logs in Supabase?
- [ ] Is the token balance > 0?

---

## 🎯 Useful Info for Bug Reports

If issue persists after these steps, collect this info:

1. **Your Solana address**: (first 8 chars is enough)
2. **Mint address of problem token**: 
3. **Token Symbol and Name**:
4. **Console logs**: (screenshot or copy/paste)
5. **Server logs**: (from Supabase panel)
6. **Network Mode**: Mainnet or Testnet?
7. **Explorer Link**: link from solana explorer

---

## ✅ Improvements Made for Better Debugging

### 1. Better Logs in TokenLoader
- ✅ Log all tokens received from blockchain
- ✅ Log details of each token being added
- ✅ Log logoUrl from Helius

### 2. Better Logs in Server
- ✅ Log all token accounts (even with 0 balance)
- ✅ Log metadata for each token
- ✅ Clearer error logs

### 3. Fix logoUrl Priority
- ✅ Prioritize logoUrl from Helius DAS API
- ✅ Fallback to CoinGecko if Helius has no logo

---

## 🚀 What Should Happen

When you send PUMP or PAI tokens to your wallet:

1. **Server receives RPC call** → Fetches all token accounts
2. **Finds your token** → Sees mint address and amount > 0
3. **Fetches metadata** → Gets symbol, name, logo from Helius
4. **Returns to frontend** → Token in the response array
5. **TokenLoader processes** → Adds to tokens list
6. **UI renders** → Token appears in wallet with logo and balance

If any step fails, the logs will show where the problem is!

---

**Last Updated**: November 17, 2024  
**Version**: 1.0  
**Status**: Active and Testing
