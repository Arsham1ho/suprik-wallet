# 🪐 Jupiter Swap - Technical Documentation

## Architecture Overview

Saturn Wallet now integrates **Jupiter Aggregator v6** for real on-chain swaps on Solana blockchain.

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Swap.tsx Component                                   │  │
│  │  - User input handling                                │  │
│  │  - Real-time quote updates                            │  │
│  │  - Transaction status                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (Hono on Deno/Supabase)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Jupiter API Endpoints                                │  │
│  │  - /jupiter-quote    (GET quote)                      │  │
│  │  - /jupiter-swap     (Execute swap)                   │  │
│  │  - /jupiter-tokens   (Get token list)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────┬────────────────┘
                         │                   │
                         ▼                   ▼
              ┌──────────────────┐  ┌───────────────────┐
              │  Jupiter API v6  │  │  Helius RPC       │
              │  (Quote & Swap)  │  │  (Transaction)    │
              └──────────────────┘  └───────────────────┘
                         │                   │
                         └─────────┬─────────┘
                                   ▼
                         ┌──────────────────┐
                         │ Solana Blockchain│
                         │   (Mainnet)      │
                         └──────────────────┘
```

---

## API Endpoints

### 1. `/make-server-e5bc10d1/jupiter-quote`

Get the best swap route and price from Jupiter.

**Request:**
```typescript
POST /make-server-e5bc10d1/jupiter-quote
Content-Type: application/json
Authorization: Bearer {publicAnonKey}

{
  "inputMint": "So11111111111111111111111111111111111111112",  // SOL
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "amount": 1000000000,        // 1 SOL in lamports (9 decimals)
  "slippageBps": 50            // 0.5% slippage (50 basis points)
}
```

**Response:**
```typescript
{
  "success": true,
  "quote": {
    "inputMint": "So11111111111111111111111111111111111111112",
    "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "inAmount": "1000000000",
    "outAmount": "140000000",  // 140 USDC (6 decimals)
    "otherAmountThreshold": "139300000",
    "swapMode": "ExactIn",
    "slippageBps": 50,
    "priceImpactPct": "0.01",
    "routePlan": [...],        // Array of swap steps
    "contextSlot": 123456789,
    "timeTaken": 0.123
  },
  "uiData": {
    "inputAmount": 1.0,
    "outputAmount": 140.0,
    "priceImpact": "0.01",
    "route": "Raydium → Orca"
  }
}
```

### 2. `/make-server-e5bc10d1/jupiter-swap`

Execute the swap transaction on-chain.

**Request:**
```typescript
POST /make-server-e5bc10d1/jupiter-swap
Content-Type: application/json
Authorization: Bearer {publicAnonKey}

{
  "walletId": "wallet_abc123",
  "quote": {...},              // Quote object from /jupiter-quote
  "priorityFee": "medium"      // low | medium | high | veryHigh
}
```

**Response:**
```typescript
{
  "success": true,
  "signature": "5j7s8K9L...",  // Solana transaction signature
  "explorerUrl": "https://solscan.io/tx/5j7s8K9L...",
  "activity": {
    "id": "5j7s8K9L...",
    "type": "swap",
    "fromToken": "So11111111111111111111111111111111111111112",
    "toToken": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "fromAmount": 1.0,
    "toAmount": 140.0,
    "status": "confirmed",
    "timestamp": "2025-11-09T...",
    "signature": "5j7s8K9L...",
    "network": "mainnet",
    "isJupiter": true,
    "priceImpact": "0.01"
  }
}
```

### 3. `/make-server-e5bc10d1/jupiter-tokens`

Get list of supported tokens from Jupiter.

**Request:**
```typescript
GET /make-server-e5bc10d1/jupiter-tokens
Authorization: Bearer {publicAnonKey}
```

**Response:**
```typescript
{
  "success": true,
  "tokens": [
    {
      "address": "So11111111111111111111111111111111111111112",
      "symbol": "SOL",
      "name": "Solana",
      "decimals": 9,
      "logoURI": "https://..."
    },
    // ... more tokens
  ],
  "totalCount": 15000,  // Total Jupiter tokens
  "ourCount": 15        // Our supported tokens
}
```

---

## Token Mint Addresses

Hardcoded mapping of symbols to Solana mint addresses:

```typescript
const TOKEN_MINTS: Record<string, string> = {
  'SOL': 'So11111111111111111111111111111111111111112',
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  'BONK': 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  'JUP': 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  'WIF': 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  'JTO': 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  'PYTH': 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  'RAY': '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  'ORCA': 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  'PAI': 'CKfatsPMUf8SkiURsDXs7eK6GWb4Jsd6UDbs7twMCWxo',
  // ... more tokens
};
```

---

## Frontend Implementation

### State Management

```typescript
// Jupiter-specific state
const [useJupiter, setUseJupiter] = useState(true);
const [jupiterQuote, setJupiterQuote] = useState<any>(null);
const [loadingQuote, setLoadingQuote] = useState(false);
const [priceImpact, setPriceImpact] = useState<number | null>(null);
const [route, setRoute] = useState<string | null>(null);
```

### Quote Fetching

```typescript
const getJupiterQuote = async (
  inputMint: string,
  outputMint: string,
  amount: string
) => {
  if (!amount || parseFloat(amount) <= 0) return;

  setLoadingQuote(true);
  
  try {
    // Convert to lamports (9 decimals for SOL)
    const amountInLamports = Math.floor(
      parseFloat(amount) * Math.pow(10, 9)
    );
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/jupiter-quote`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputMint,
          outputMint,
          amount: amountInLamports,
          slippageBps: Math.floor(parseFloat(slippage) * 100),
        }),
      }
    );

    const data = await response.json();
    
    if (data.success && data.quote) {
      setJupiterQuote(data.quote);
      setPriceImpact(parseFloat(data.quote.priceImpactPct));
      setRoute(data.uiData?.route || null);
      setToAmount(data.uiData?.outputAmount.toFixed(6));
    }
  } catch (error) {
    console.error('Jupiter quote error:', error);
    toast.error(`Could not get price quote: ${error.message}`);
  } finally {
    setLoadingQuote(false);
  }
};
```

### Swap Execution

```typescript
const handleJupiterSwap = async () => {
  if (!jupiterQuote) {
    throw new Error('No quote available');
  }

  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/jupiter-swap`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletId,
        quote: jupiterQuote,
        priorityFee: 'medium',
      }),
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to execute swap');
  }

  toast.success(
    `Swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}!`,
    {
      description: `Transaction: ${data.signature?.substring(0, 8)}...`,
    }
  );
  
  // Refresh balances and activity
  onSwapComplete?.();
  window.dispatchEvent(new Event('walletBalanceUpdated'));
};
```

---

## Backend Implementation

### Quote Endpoint

```typescript
app.post("/make-server-e5bc10d1/jupiter-quote", async (c) => {
  const { inputMint, outputMint, amount, slippageBps } = await c.req.json();
  
  // Convert symbol to mint if needed
  const inputMintAddress = TOKEN_MINTS[inputMint] || inputMint;
  const outputMintAddress = TOKEN_MINTS[outputMint] || outputMint;
  
  // Call Jupiter API
  const params = new URLSearchParams({
    inputMint: inputMintAddress,
    outputMint: outputMintAddress,
    amount: amount.toString(),
    slippageBps: (slippageBps || 50).toString(),
    onlyDirectRoutes: 'false',
    asLegacyTransaction: 'false',
  });
  
  const response = await fetch(
    `https://quote-api.jup.ag/v6/quote?${params.toString()}`
  );
  
  const quoteData = await response.json();
  
  return c.json({
    success: true,
    quote: quoteData,
    uiData: {
      inputAmount: parseFloat(quoteData.inAmount) / 1e9,
      outputAmount: parseFloat(quoteData.outAmount) / 1e9,
      priceImpact: quoteData.priceImpactPct,
      route: quoteData.routePlan?.map(r => r.swapInfo?.label).join(' → '),
    },
  });
});
```

### Swap Endpoint

```typescript
app.post("/make-server-e5bc10d1/jupiter-swap", async (c) => {
  const { walletId, quote, priorityFee } = await c.req.json();
  
  // Get wallet and derive keypair
  const wallet = await kv.get(`wallet:${walletId}`);
  const keypair = await deriveKeypairFromMnemonic(wallet.mnemonic);
  
  // Get serialized transaction from Jupiter
  const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: bs58.encode(keypair.publicKey),
      wrapAndUnwrapSol: true,
      priorityLevelWithMaxLamports: {
        priorityLevel: priorityFee || 'medium',
      },
      dynamicComputeUnitLimit: true,
    }),
  });
  
  const { swapTransaction } = await swapResponse.json();
  
  // Deserialize, sign, and send
  const tx = VersionedTransaction.deserialize(
    Uint8Array.from(atob(swapTransaction), c => c.charCodeAt(0))
  );
  
  tx.sign([keypair]);
  
  const signature = await connection.sendRawTransaction(
    tx.serialize(),
    { skipPreflight: false, maxRetries: 3 }
  );
  
  // Wait for confirmation
  await connection.confirmTransaction(signature, 'confirmed');
  
  // Record in activity
  const activity = {
    id: signature,
    type: 'swap',
    fromToken: quote.inputMint,
    toToken: quote.outputMint,
    fromAmount: parseFloat(quote.inAmount) / 1e9,
    toAmount: parseFloat(quote.outAmount) / 1e9,
    status: 'confirmed',
    timestamp: new Date().toISOString(),
    signature,
    network: 'mainnet',
    isJupiter: true,
    priceImpact: quote.priceImpactPct,
  };
  
  return c.json({
    success: true,
    signature,
    explorerUrl: `https://solscan.io/tx/${signature}`,
    activity,
  });
});
```

---

## Security Considerations

### 1. Private Key Management
- ✅ Private keys derived server-side only
- ✅ Never sent to frontend
- ✅ Transaction signing in backend
- ❌ Never log or cache private keys

### 2. Transaction Validation
```typescript
// Validate inputs
if (!isValidSolanaAddress(inputMint)) throw new Error('Invalid input mint');
if (!isValidSolanaAddress(outputMint)) throw new Error('Invalid output mint');
if (amount <= 0) throw new Error('Invalid amount');

// Check balance
const balance = await getBalance(walletAddress);
if (amount > balance) throw new Error('Insufficient balance');

// Verify quote freshness (< 30 seconds old)
const quoteAge = Date.now() - quote.timestamp;
if (quoteAge > 30000) throw new Error('Quote expired');
```

### 3. Slippage Protection
```typescript
// Enforce maximum slippage
const MAX_SLIPPAGE_BPS = 500; // 5%
if (slippageBps > MAX_SLIPPAGE_BPS) {
  throw new Error('Slippage too high');
}

// Price impact warning
if (priceImpactPct > 5) {
  // Show warning to user
  console.warn('High price impact:', priceImpactPct);
}
```

### 4. Rate Limiting
```typescript
// Limit quote requests
const QUOTE_RATE_LIMIT = 10; // per minute
const SWAP_RATE_LIMIT = 5;   // per minute

// Implement in middleware
app.use('/jupiter-*', rateLimiter({ limit: QUOTE_RATE_LIMIT }));
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `No quote available` | Quote request failed | Retry with backoff |
| `Insufficient liquidity` | Not enough liquidity in DEX | Reduce amount or try different token |
| `Slippage exceeded` | Price moved too much | Increase slippage tolerance |
| `Transaction timeout` | Network congestion | Increase priority fee |
| `Insufficient balance` | Not enough tokens | Reduce amount or add funds |

### Error Response Format

```typescript
{
  "error": "Failed to execute swap",
  "details": "Slippage tolerance exceeded",
  "code": "SLIPPAGE_EXCEEDED",
  "retryable": true,
  "suggestion": "Increase slippage tolerance in settings"
}
```

---

## Performance Optimization

### 1. Quote Caching
```typescript
// Cache quotes for 10 seconds
const quoteCache = new Map<string, { quote: any, timestamp: number }>();

const getCachedQuote = (key: string) => {
  const cached = quoteCache.get(key);
  if (cached && Date.now() - cached.timestamp < 10000) {
    return cached.quote;
  }
  return null;
};
```

### 2. Debounced Quote Requests
```typescript
// Debounce user input
const debouncedGetQuote = debounce(getJupiterQuote, 500);

// Call on amount change
const handleAmountChange = (value: string) => {
  setFromAmount(value);
  debouncedGetQuote(inputMint, outputMint, value);
};
```

### 3. Parallel Requests
```typescript
// Fetch quote and token prices in parallel
const [quote, prices] = await Promise.all([
  getJupiterQuote(...),
  getCoinGeckoPrices(...),
]);
```

---

## Testing

### Unit Tests
```typescript
describe('Jupiter Integration', () => {
  it('should get valid quote', async () => {
    const quote = await getJupiterQuote('SOL', 'USDC', '1');
    expect(quote).toBeDefined();
    expect(quote.outAmount).toBeGreaterThan(0);
  });
  
  it('should execute swap', async () => {
    const signature = await executeJupiterSwap(walletId, quote);
    expect(signature).toMatch(/^[A-Za-z0-9]{87,88}$/);
  });
});
```

### Integration Tests
```typescript
describe('End-to-End Swap', () => {
  it('should complete full swap flow', async () => {
    // 1. Get quote
    const quote = await getQuote();
    
    // 2. Execute swap
    const result = await executeSwap(quote);
    
    // 3. Verify on-chain
    const tx = await connection.getTransaction(result.signature);
    expect(tx.meta.err).toBeNull();
  });
});
```

---

## Monitoring & Logging

### Logging Format
```typescript
console.log('🪐 Jupiter Quote Request:', {
  inputMint,
  outputMint,
  amount,
  timestamp: new Date().toISOString(),
});

console.log('✅ Jupiter Quote Received:', {
  outAmount: quote.outAmount,
  priceImpact: quote.priceImpactPct,
  route: quote.routePlan.length,
  timeTaken: quote.timeTaken,
});

console.log('🎉 Swap Successful:', {
  signature,
  fromAmount,
  toAmount,
  timestamp: new Date().toISOString(),
});
```

### Metrics to Track
- Quote response time
- Swap success rate
- Average price impact
- Transaction confirmation time
- Error rates by type

---

## Future Enhancements

### Phase 2
- [ ] Support more input tokens (USDC, USDT, etc.)
- [ ] Limit orders
- [ ] DCA (Dollar Cost Averaging)
- [ ] Advanced routing options

### Phase 3
- [ ] Portfolio rebalancing
- [ ] Auto-compounding
- [ ] Gas optimization
- [ ] Multi-hop swaps

---

## References

- [Jupiter API Docs](https://station.jup.ag/docs/apis/swap-api)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Helius RPC](https://docs.helius.dev/)
- [Solscan Explorer](https://solscan.io/)

---

**Built with ❤️ for Saturn Wallet**
**Powered by 🪐 Jupiter Aggregator v6**
