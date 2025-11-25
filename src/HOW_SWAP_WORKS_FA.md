# 🔄 چطور Swap کار می‌کند؟

## نحوه عملکرد دقیق Swap در Suprik

این فایل توضیح می‌دهد که swap دقیقاً چطور کار می‌کند، گام به گام.

---

## 📋 فهرست مطالب

1. [جریان کلی](#جریان-کلی)
2. [دریافت Quote](#دریافت-quote)
3. [اجرای Swap](#اجرای-swap)
4. [Error Handling](#error-handling)
5. [Testnet vs Mainnet](#testnet-vs-mainnet)

---

## 🔄 جریان کلی

```
User Input → Validation → Get Quote → Show Quote → User Confirms → Execute Swap → Update Balance
```

### گام به گام:

#### 1. کاربر مقدار وارد می‌کند
```typescript
handleFromAmountChange("0.1") // 0.1 SOL
```

#### 2. Validation
```typescript
if (!value || parseFloat(value) <= 0 || !fromTokenData || !toTokenData) {
  // Clear and return
  return;
}
```

#### 3. Get Quote
```typescript
getJupiterQuoteData(
  inputMint: "So111...",   // SOL mint address
  outputMint: "EPjFW...",  // USDC mint address
  amount: "0.1",
  inputSymbol: "SOL",
  outputSymbol: "USDC"
)
```

#### 4. Show Quote
```typescript
// UI updates:
toAmount: "14.5" // ≈ $145 USDC
priceImpact: "0.01%" // Very low!
route: "Raydium → Orca" // Best route
```

#### 5. کاربر تأیید می‌کند
```typescript
initiateSwap() → biometric check → handleSwap()
```

#### 6. Execute Swap
```typescript
executeJupiterSwap({
  mnemonic: wallet.mnemonic,
  quoteResponse: jupiterQuote,
  isTestnet: false
})
```

#### 7. Update Balance
```typescript
// Old balance: 1.0 SOL, 0 USDC
// New balance: 0.9 SOL, 14.5 USDC
window.dispatchEvent(new Event('walletBalanceUpdated'))
```

---

## 📊 دریافت Quote

### روش 1: Direct API (Primary)

```typescript
// Step 1: Try direct call to Jupiter API
const quoteUrl = `https://quote-api.jup.ag/v6/quote?
  inputMint=So111...&
  outputMint=EPjFW...&
  amount=100000000& // 0.1 SOL in lamports
  slippageBps=50`   // 0.5% slippage

fetch(quoteUrl)
  .then(response => response.json())
  .then(quote => {
    // Success! Use this quote
  })
```

**Timeout**: 10 seconds  
**وضعیت**: سریع‌ترین روش (معمولاً < 2s)

---

### روش 2: Proxy API (Fallback)

```typescript
// Step 2: If direct fails, try proxy
const proxyUrl = `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/jupiter/quote?...`

fetch(proxyUrl, {
  headers: {
    'Authorization': `Bearer ${publicAnonKey}`
  }
})
  .then(response => response.json())
  .then(quote => {
    // Success! Use this quote
  })
```

**Timeout**: 12 seconds  
**وضعیت**: کمی کندتر اما قابل اعتماد

---

### روش 3: Mock Quote (Last Resort)

```typescript
// Step 3: If both fail, generate mock quote
const generateMockQuote = () => {
  // For SOL → USDC
  const exchangeRate = 100; // ~$100 per SOL
  const outputAmount = amount * exchangeRate * 0.997; // Apply 0.3% fee
  
  return {
    inputAmount: 0.1,
    outputAmount: 14.5,
    priceImpact: 0.1,
    route: ['Simulated Mode']
  };
}
```

**استفاده**: فقط زمانی که network/CORS مشکل دارد  
**وضعیت**: فوری (< 1s)

---

## 🚀 اجرای Swap

### Testnet Mode (Simulation)

```typescript
if (isTestnet) {
  // Simulate 2.5 second swap
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // Generate mock signature
  const mockSignature = `jupiter_demo_${Date.now()}_${Math.random()...}`;
  
  // Update balance locally (no blockchain)
  updateLocalBalance();
  
  return {
    success: true,
    signature: mockSignature
  };
}
```

**مزیت**: رایگان، سریع، برای تست عالی است

---

### Mainnet Mode (Real Swap)

```typescript
// Step 1: Get swap transaction from Jupiter
const swapUrl = 'https://quote-api.jup.ag/v6/swap';

const swapData = await fetch(swapUrl, {
  method: 'POST',
  body: JSON.stringify({
    quoteResponse: jupiterQuote,
    userPublicKey: wallet.publicKey,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: 'auto'
  })
}).then(r => r.json());

// Step 2: Deserialize transaction
const transaction = VersionedTransaction.deserialize(
  Buffer.from(swapData.swapTransaction, 'base64')
);

// Step 3: Sign with user's keypair
const keypair = await deriveSolanaKeypair(mnemonic);
transaction.sign([keypair]);

// Step 4: Broadcast to blockchain
const signature = await connection.sendRawTransaction(
  transaction.serialize()
);

// Step 5: Wait for confirmation
await connection.confirmTransaction(signature);

// ✅ Success!
return {
  success: true,
  signature: signature // Real blockchain signature
};
```

**مزیت**: واقعی، on-chain، قابل verify در Solscan

---

## 🛡️ Error Handling

### سطح 1: Input Validation

```typescript
// Check amount
if (!value || parseFloat(value) <= 0) {
  toast.error('Please enter a valid amount');
  return;
}

// Check balance
if (parseFloat(value) > balance) {
  toast.error('Insufficient balance');
  return;
}

// Check tokens selected
if (!fromToken || !toToken) {
  toast.error('Please select tokens');
  return;
}
```

---

### سطح 2: Network Errors

```typescript
try {
  // Try to get quote
} catch (error) {
  if (error.name === 'AbortError') {
    toast.error('Request timeout. Please try again.');
  } else if (error.message.includes('network')) {
    // Fallback to mock quote
    const mockQuote = generateMockQuote();
    return mockQuote;
  }
}
```

---

### سطح 3: Swap Errors

```typescript
try {
  // Execute swap
} catch (error) {
  let errorMessage = 'Failed to complete swap';
  
  if (error.message.includes('Insufficient balance')) {
    errorMessage = 'Insufficient balance to complete swap';
  } else if (error.message.includes('locked')) {
    errorMessage = 'Please unlock your wallet first';
  } else if (error.message.includes('timeout')) {
    errorMessage = 'Transaction timed out. Please try again';
  }
  
  toast.error(errorMessage);
}
```

---

## 🌐 Testnet vs Mainnet

### Testnet Mode

```typescript
network.isTestnet = true

Quote:
✅ Mock quote generated locally
✅ Instant (< 1s)
✅ No API calls needed

Swap:
✅ Simulated locally
✅ Fast (2.5s)
✅ No fees
✅ Balance updated in localStorage
❌ Not on blockchain
```

**کاربرد**: Testing, development, demo

---

### Mainnet Mode

```typescript
network.isTestnet = false

Quote:
✅ Real Jupiter API quote
✅ Fast (2-3s)
✅ Real market prices
✅ Best routing from 15+ DEXs

Swap:
✅ Real blockchain transaction
✅ Slower (10-15s)
✅ Real fees (network + Jupiter)
✅ Balance updated on-chain
✅ Viewable on Solscan
```

**کاربرد**: Production, real swaps

---

## 🔐 امنیت

### Client-Side Signing

```typescript
// Private key NEVER leaves the device
const keypair = await deriveSolanaKeypair(mnemonic);
transaction.sign([keypair]);
```

### Slippage Protection

```typescript
// Minimum output amount guaranteed
const minOutputAmount = outputAmount * (1 - slippage / 100);

// If actual output < minOutputAmount → transaction fails
```

### Balance Checking

```typescript
// Always check balance BEFORE swap
if (totalDeducted > fromTokenData.balance) {
  throw new Error('Insufficient balance');
}
```

---

## 📈 مثال کامل

### Scenario: Swap 0.1 SOL → USDC

```typescript
// 1. User input
fromAmount = "0.1"
fromToken = "SOL"
toToken = "USDC"

// 2. Get quote
inputMint = "So11111111111111111111111111111111111111112"
outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
amount = 0.1 * 10^9 = 100000000 lamports

// 3. Jupiter returns quote
{
  outAmount: "14523000", // 14.523 USDC (6 decimals)
  priceImpactPct: "0.01",
  routePlan: [
    { swapInfo: { label: "Raydium CLMM" } }
  ]
}

// 4. Convert to UI
outputAmount = 14523000 / 10^6 = 14.523 USDC
priceImpact = 0.01%
route = "Raydium CLMM"

// 5. Show to user
"You receive: ~14.523 USDC"
"Price impact: 0.01%"
"Route: Raydium CLMM"

// 6. User confirms
// 7. Execute swap
signature = "5j7s8K9L3m4N5o6P7q8R9s0T1u2V3w4X..."

// 8. Success!
toast.success("Swapped 0.1 SOL for 14.523 USDC!")
```

---

## 🎯 نتیجه‌گیری

Swap در Suprik:

1. ✅ **سریع**: Quote در < 3s، Swap در < 15s
2. ✅ **قابل اعتماد**: Triple fallback system
3. ✅ **امن**: Client-side signing
4. ✅ **شفاف**: واضح‌ترین error messages
5. ✅ **حرفه‌ای**: مثل Phantom عمل می‌کند

---

## 📞 سوالات؟

برای اطلاعات بیشتر:
- راهنمای کاربر: `/HOW_TO_SWAP_FA.md`
- مستندات فنی: `/JUPITER_TECHNICAL_DOCS.md`
- راهنمای تست: `/SWAP_TESTING_FINAL_FA.md`

---

**🎊 حالا می‌دانید swap چطور کار می‌کند! 🚀**
