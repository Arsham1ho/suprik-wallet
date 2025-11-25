# 🔧 Solana Rent-Exempt Fix

## مشکل
هنگام ارسال SOL، خطای زیر رخ می‌داد:
```
Transaction simulation failed: Transaction results in an account (0) 
with insufficient funds for rent
```

## دلیل مشکل
در Solana، هر account باید حداقل موجودی را برای "rent-exemption" حفظ کند:
- **Rent-exempt minimum**: حدود `0.00089088 SOL`
- اگر balance زیر این مقدار برود، account deactivated می‌شود
- باید این minimum را همیشه در حساب نگه داریم

## راه‌حل پیاده‌سازی شده

### 1️⃣ Frontend (`/components/pages/Send.tsx`)

#### محاسبه MAX Amount:
```typescript
const handleMaxAmount = () => {
  if (selectedToken.symbol === 'SOL') {
    // Reserve calculation:
    // - 0.001 SOL minimum app fee
    // - 0.000005 SOL network fee
    // - 0.00089088 SOL rent-exempt minimum
    // - 0.0002 SOL safety buffer
    // Total reserve: ~0.002 SOL
    const rentExemptReserve = 0.002;
    const maxSendable = Math.max(0, selectedToken.amount - rentExemptReserve);
    setAmount(maxSendable.toFixed(6));
  }
};
```

#### Validation قبل از ارسال:
```typescript
const RENT_EXEMPT_MINIMUM = 0.00089088;
const NETWORK_FEE = 0.000005;
const SAFETY_BUFFER = 0.0002;
const MIN_REMAINING_BALANCE = RENT_EXEMPT_MINIMUM + NETWORK_FEE + SAFETY_BUFFER;

const totalRequired = sendAmount + calculatedFee;
const balanceAfterTransaction = selectedToken.amount - totalRequired;

// بررسی اینکه بعد از transaction، account rent-exempt بماند
if (balanceAfterTransaction < MIN_REMAINING_BALANCE) {
  const maxSendable = Math.max(0, selectedToken.amount - calculatedFee - MIN_REMAINING_BALANCE);
  toast.error(
    `Maximum you can send: ${maxSendable.toFixed(6)} SOL`,
    { description: 'Solana accounts need ~0.002 SOL minimum to stay active' }
  );
  return;
}
```

### 2️⃣ Backend (`/supabase/functions/server/index.tsx`)

#### ثابت‌های تعریف شده:
```typescript
const RENT_EXEMPT_MINIMUM = 0.00089088; // Solana rent-exempt minimum
const NETWORK_FEE = 0.000005; // Network transaction fee
const SAFETY_BUFFER = 0.0002; // Additional safety buffer
const MIN_REMAINING_BALANCE = RENT_EXEMPT_MINIMUM + NETWORK_FEE + SAFETY_BUFFER;
// Total: ~0.00109588 SOL
```

#### بررسی دوگانه:
```typescript
// 1. بررسی balance کافی
const totalRequired = sendAmount + appFee + MIN_REMAINING_BALANCE;
if (currentBalance < totalRequired) {
  return c.json({ 
    error: `Insufficient balance. You need ${totalRequired.toFixed(6)} SOL...`,
    breakdown: {
      sendAmount,
      appFee,
      rentReserve: MIN_REMAINING_BALANCE,
      total: totalRequired
    }
  }, 400);
}

// 2. بررسی rent-exempt بودن بعد از transaction
const balanceAfterTransaction = currentBalance - sendAmount - appFee;
if (balanceAfterTransaction < MIN_REMAINING_BALANCE) {
  return c.json({
    error: `Transaction would leave account below rent-exempt minimum...`,
    balanceAfter: balanceAfterTransaction,
    minimumRequired: MIN_REMAINING_BALANCE,
    suggestion: `Try sending ${Math.max(0, currentBalance - appFee - MIN_REMAINING_BALANCE).toFixed(6)} SOL`
  }, 400);
}
```

### 3️⃣ پیام‌های خطای بهتر

```typescript
// در frontend
if (errorMessage.includes('insufficient funds for rent')) {
  errorMessage = 'Insufficient funds for rent-exempt minimum';
  errorDescription = 'Solana accounts must maintain ~0.002 SOL to stay active.';
}
```

## نتیجه

✅ **قبل از Fix:**
- کاربر می‌توانست تمام SOL را ارسال کند
- Transaction fail می‌شد با rent error
- Account ممکن بود deactivated شود

✅ **بعد از Fix:**
- MAX button همیشه 0.002 SOL کم می‌کند
- Validation قبل از ارسال
- Validation در سمت server
- پیام‌های خطای واضح و راهنما
- Account همیشه rent-exempt می‌ماند

## مقادیر مهم

| Item | Amount (SOL) | توضیح |
|------|-------------|--------|
| Rent-exempt minimum | 0.00089088 | حداقل برای active بودن account |
| Network fee | 0.000005 | هزینه transaction |
| Safety buffer | 0.0002 | فاصله اطمینان |
| **Total Reserve** | **~0.002** | **مجموع کل (در frontend)** |
| Server minimum | ~0.00109588 | حداقل در سمت server |

## تست

برای تست:
1. یک wallet با مثلاً `0.005 SOL` بسازید
2. روی MAX کلیک کنید
3. باید `0.003 SOL` را برای ارسال پیشنهاد دهد (0.005 - 0.002)
4. سعی کنید `0.004 SOL` ارسال کنید
5. باید خطای rent-exempt دریافت کنید با پیشنهاد مقدار صحیح

## منابع

- [Solana Rent Documentation](https://docs.solana.com/developing/programming-model/accounts#rent)
- [Rent-exempt Calculation](https://docs.solana.com/developing/programming-model/accounts#calculation-of-rent)
