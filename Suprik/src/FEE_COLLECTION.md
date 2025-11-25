# 💰 Fee Collection System - Saturn Wallet

## Overview
سیستم جمع‌آوری کارمزد Saturn به شما این امکان را می‌دهد که از هر تراکنش swap، کارمزد 0.5% دریافت کنید.

## How It Works

### 1️⃣ **Fee Calculation**
- کارمزد: **0.5%** از مبلغ swap
- محاسبه: `fee = swapAmount × 0.005`
- مثال: اگر کاربر 100 USDT swap کند، کارمزد = 0.5 USDT

### 2️⃣ **Fee Deduction**
کارمزد به صورت خودکار از balance کاربر کسر می‌شود:
```
Total Deducted = Swap Amount + Fee
```

مثال:
- User wants to swap: **10 SOL**
- Fee (0.5%): **0.05 SOL**
- **Total deducted from balance: 10.05 SOL**

### 3️⃣ **Fee Tracking**
کارمزدها در دیتابیس Supabase ذخیره می‌شوند:

**Location:** `fees:{APP_FEE_WALLET}`

**Structure:**
```typescript
{
  total: 150.75,  // Total USD collected
  swaps: [
    {
      swapId: "swap-1234567890-abc123",
      walletId: "user-wallet-id",
      fromToken: "SOL",
      feeAmount: 0.05,      // Fee in token
      feeUSD: 2.50,         // Fee in USD
      timestamp: "2024-11-03T10:30:00Z"
    },
    // ... more swaps
  ]
}
```

### 4️⃣ **Fee Wallet**
کارمزدها به wallet مشخص شده در environment variable ارسال می‌شوند:

```bash
APP_FEE_WALLET=your-wallet-address-here
```

⚠️ **در حال حاضر**: کارمزدها فقط **tracked** می‌شوند (ذخیره در دیتابیس)

🚀 **برای Production**: باید یک transaction واقعی on-chain به fee wallet ارسال شود.

## API Endpoints

### Get Fee Data
```bash
GET /make-server-e5bc10d1/fees
```

**Response:**
```json
{
  "total": 150.75,
  "swaps": [...]
}
```

### Swap with Fee
```bash
POST /make-server-e5bc10d1/swap-tokens
```

**Request:**
```json
{
  "walletId": "user-123",
  "fromTokenId": "solana",
  "fromTokenSymbol": "SOL",
  "fromAmount": 10,
  "toTokenId": "usd-coin",
  "toTokenSymbol": "USDC",
  "toAmount": 500,
  "feeAmount": 0.05,      // Fee in fromToken
  "feeUSD": 2.50,         // Fee in USD
  "totalDeducted": 10.05  // Total deducted
}
```

## Fee Dashboard

دو راه برای مشاهده کارمزدهای جمع‌شده:

### 1. Settings Page (Quick View)
- Navigate به **Settings**
- بخش "Fee Collection" را ببینید
- نمایش: Total fees + recent swaps

### 2. Fee Admin Dashboard (Full View)
- Settings → "View Full Fee Dashboard"
- نمایش جزئیات کامل:
  - Total collected (USD)
  - Total swaps count
  - Average fee per swap
  - Fees by token (breakdown)
  - All swap transactions with details

## Implementation Details

### Frontend (Swap.tsx)
```typescript
// Calculate fee (0.5%)
const feeInFromToken = fromAmount * 0.005;
const totalDeducted = fromAmount + feeInFromToken;

// Check sufficient balance
if (totalDeducted > userBalance) {
  toast.error('Insufficient balance to cover swap amount and fee');
  return;
}
```

### Backend (index.tsx)
```typescript
// Store fee data
const collectedFees = await kv.get(`fees:${feeWallet}`) || { total: 0, swaps: [] };
collectedFees.total += parseFloat(feeUSD);
collectedFees.swaps.unshift({
  swapId,
  walletId,
  fromToken,
  feeAmount,
  feeUSD,
  timestamp: new Date().toISOString(),
});
await kv.set(`fees:${feeWallet}`, collectedFees);
```

## Production Implementation

برای یک کیف پول production، باید این مراحل را اضافه کنید:

### 1. On-Chain Fee Transfer
```typescript
// بعد از swap موفق، fee را به wallet ارسال کنید
const feeTransaction = await sendTokens({
  from: userWallet,
  to: FEE_WALLET_ADDRESS,
  token: fromToken,
  amount: feeAmount,
  network: network
});

// منتظر confirmation بمانید
await feeTransaction.wait();
```

### 2. Multi-Network Support
کارمزدها باید در network مربوطه ارسال شوند:
- Solana swaps → fee در SOL به Solana address
- Ethereum swaps → fee در ETH به Ethereum address
- Bitcoin swaps → fee در BTC به Bitcoin address

### 3. Fee Wallet Setup
یک wallet برای هر network بسازید:
```bash
SOLANA_FEE_WALLET=...
ETHEREUM_FEE_WALLET=...
BITCOIN_FEE_WALLET=...
POLYGON_FEE_WALLET=...
```

### 4. Error Handling
```typescript
try {
  // Perform swap
  await executeSwap(...);
  
  // Transfer fee
  await transferFee(...);
} catch (error) {
  // اگر swap موفق اما fee transfer فیل شد:
  // 1. Log the error
  // 2. Queue for retry
  // 3. Alert admin
  console.error('Fee transfer failed:', error);
  await queueFailedFee({ swapId, feeAmount, ... });
}
```

### 5. Withdrawal System
یک endpoint برای برداشت کارمزدها:
```typescript
POST /admin/withdraw-fees
{
  "network": "solana",
  "toAddress": "admin-withdrawal-address",
  "amount": 100.50
}
```

## Security Considerations

⚠️ **مهم:**
1. **Never expose private keys** در frontend
2. Fee wallet private keys باید در backend محافظت شوند
3. استفاده از **multi-signature wallets** برای fee collection
4. Regular audits کارمزدهای جمع‌شده
5. Rate limiting برای جلوگیری از abuse

## Analytics

داده‌های مفید برای tracking:

- **Daily fee revenue**: کارمزد روزانه
- **Popular swap pairs**: کدام swap ها بیشترین کارمزد را دارند
- **Average swap size**: میانگین مبلغ swap
- **Peak hours**: ساعات شلوغی
- **User retention**: کاربرانی که swap تکراری انجام می‌دهند

## Testing

برای تست سیستم کارمزد:

1. انتخاب توکن با balance
2. Swap با مقادیر مختلف
3. بررسی کسر صحیح fee از balance
4. چک کردن Settings → Fee Collection
5. مشاهده Fee Admin Dashboard

## Questions?

اگر سوالی داشتید:
- بررسی کنید `/components/pages/Swap.tsx` - محاسبه fee
- بررسی کنید `/supabase/functions/server/index.tsx` - ذخیره fee
- بررسی کنید `/components/pages/FeeAdmin.tsx` - نمایش dashboard

---

**نکته:** این یک prototype است. برای production، حتماً on-chain fee transfers را پیاده‌سازی کنید! 🚀
