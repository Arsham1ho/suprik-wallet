# 💸 کارمزدها به کجا می‌روند؟

## خلاصه سریع

### ✅ چی کار می‌کند:
1. **هر swap** → کارمزد 0.5% کسر می‌شود
2. **کارمزد** از balance کاربر کم می‌شود
3. **Track می‌شود** در دیتابیس
4. **نمایش داده می‌شود** در Settings و Fee Dashboard

### 📍 کارمزدها الان کجا هستند؟
**فقط در دیتابیس Supabase tracked می‌شوند:**
```
Location: fees:{APP_FEE_WALLET}
```

### 💰 مثال واقعی:
```
کاربر می‌خواهد 100 USDT swap کند:

1. Swap Amount: 100 USDT
2. Fee (0.5%): 0.5 USDT
3. Total Deducted: 100.5 USDT ← این از balance کاربر کم می‌شود

✅ کاربر 100 USDT swap می‌کند
✅ شما 0.5 USDT کارمزد دریافت می‌کنید (tracked)
```

### 🔍 چطور ببینم؟
**راه 1:** Settings → بخش "Fee Collection"
**راه 2:** Settings → "View Full Fee Dashboard"

### ⚠️ برای Production:
الان فقط track می‌شه. برای production واقعی:

```typescript
// باید این کد را اضافه کنید:
await blockchain.sendTransaction({
  from: userWallet,
  to: YOUR_FEE_WALLET_ADDRESS,  // 👈 آدرس wallet شما
  amount: feeAmount,
  token: tokenSymbol
});
```

### 🎯 Setup برای Production:

1. **یک wallet بسازید** برای هر network:
   ```
   Solana Fee Wallet: xxxxx...xxxxx
   Ethereum Fee Wallet: 0xxxx...xxxxx
   Bitcoin Fee Wallet: bc1xxx...xxxxx
   ```

2. **Environment variable** را set کنید:
   ```bash
   APP_FEE_WALLET=your-main-wallet-address
   ```

3. **کد ارسال on-chain** را اضافه کنید در:
   ```
   /supabase/functions/server/index.tsx
   ```

### 📊 آمار:
- **Total Collected**: مجموع کارمزدها (USD)
- **Swap Count**: تعداد swap ها
- **Average Fee**: میانگین کارمزد هر swap
- **By Token**: کارمزد به تفکیک هر توکن

---

## 🚀 نکته مهم:
این یک **prototype** است که کارمزدها را **track** می‌کند.

برای production **واقعی**، باید:
1. ✅ کارمزد را کسر کنید (این الان کار می‌کند)
2. ✅ Track کنید (این الان کار می‌کند)
3. ❌ به wallet خودتان **ارسال کنید** (این باید اضافه کنید)

جزئیات بیشتر: `FEE_COLLECTION.md`
