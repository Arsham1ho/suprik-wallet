# 🔄 Swap Guide - Suprik Wallet

## ✅ شما الان Jupiter-powered Swap دارید!

Suprik wallet شما از **Jupiter Aggregator** استفاده می‌کند - همان DEX aggregator که Phantom استفاده می‌کند!

---

## 🎯 چگونه کار می‌کند:

### Mainnet Mode (Real Swaps):
1. **Jupiter API** best price را از همه Solana DEX‌ها پیدا می‌کند:
   - Orca
   - Raydium
   - Serum
   - و 20+ DEX دیگر

2. **Best Route** را انتخاب می‌کند:
   - کمترین slippage
   - بهترین قیمت
   - Optimized routing

3. **On-chain Transaction** اجرا می‌شود:
   - Real Solana blockchain
   - Verified on Solscan
   - Permanent and immutable

### Testnet Mode (Practice):
- Simulated swaps
- No real money
- برای یاد گرفتن

---

## 🚀 How to Use:

### Step 1: انتخاب Network

Settings → Network:
- ✅ **Mainnet** - برای swaps واقعی
- 🧪 **Testnet** - برای practice

### Step 2: انتخاب Tokens

1. "You pay" → انتخاب token (مثل SOL)
2. "You receive" → انتخاب token (مثل USDC)

### Step 3: وارد کردن مقدار

- مقدار token را تایپ کنید
- یا "MAX" را کلیک کنید

### Step 4: بررسی Quote

Swap page نشان می‌دهد:

**✅ Real Mode (Mainnet با Jupiter):**
```
Real Mode - Jupiter Active
Live prices from Solana DEXs

Route: Orca → Raydium
Price Impact: +0.15%
```

**⚠️ Demo Mode (Jupiter unavailable):**
```
Demo Mode
Simulated prices (Jupiter API unavailable)
```

### Step 5: Review Swap

قبل از swap، بررسی کنید:
- ✅ Exchange rate صحیح است
- ✅ Price impact قابل قبول است (< 1%)
- ✅ Fee reasonable است
- ✅ Output amount درست است

### Step 6: Confirm Swap

1. کلیک "Swap"
2. اگر Biometric enabled است → Face ID/Touch ID
3. Transaction sign می‌شود
4. Broadcast به blockchain
5. ✅ Success! Transaction confirmed

---

## 📊 Swap Modes مقایسه:

| Mode | Network | API | Prices | Transactions | Fee |
|------|---------|-----|--------|--------------|-----|
| **Real Mode** | Mainnet | Jupiter ✅ | Live real-time | On-chain real | Real SOL |
| **Demo Mode** | Mainnet | Simulated | Mock prices | Simulated | Fake |
| **Testnet** | Testnet | Simulated | Mock prices | Simulated | Fake |

---

## ⚙️ Settings:

### Slippage Tolerance

**چیست؟**  
Maximum price change که می‌پذیرید

**Options:**
- Auto (0.5%) - Recommended
- Custom - برای advanced users

**مثال:**
- 0.5% slippage on 1 SOL → $100
- Price می‌تواند $99.50 - $100.50 باشد

### Priority Fee

**چیست؟**  
Extra fee برای faster confirmation

**Options:**
- Auto - Recommended (dynamic)
- Custom - Set manual amount

### Tip (Jito MEV)

**چیست؟**  
Optional tip برای validators

**Options:**
- Auto - No tip
- Custom - Add tip for priority

---

## ✅ چگونه بفهمیم Real Mode است؟

### 🟢 Real Mode Indicators:

1. **در UI:**
   ```
   ✅ Real Mode - Jupiter Active
   Live prices from Solana DEXs
   ```

2. **در Console (F12):**
   ```javascript
   [Jupiter] ✅ Quote received via proxy
   [Jupiter] Output amount: 100.2547
   [Jupiter] Route: Orca → Raydium
   ```

3. **Route واقعی:**
   - نام DEX‌های واقعی (Orca, Raydium, etc.)
   - نه "Demo Mode - Jupiter API Unavailable"

4. **Price Impact دقیق:**
   - مقدار متغیر (0.15%, 0.32%, etc.)
   - نه همیشه 0.1%

5. **Output Amount real-time:**
   - هر بار input تغییر می‌کند، output هم update می‌شود
   - تاخیر 1-2 ثانیه برای API call

### 🟡 Demo Mode Indicators:

1. **در UI:**
   ```
   ⚠️ Demo Mode
   Simulated prices (Jupiter API unavailable)
   ```

2. **در Console:**
   ```javascript
   [Jupiter] ✅ Generating mock quote (Jupiter API unavailable)
   ```

3. **Route:**
   ```
   Demo Mode - Jupiter API Unavailable
   ```

---

## 🔧 Troubleshooting:

### Problem: همیشه Demo Mode

**Solutions:**

1. **Check Network:**
   - Settings → Network
   - انتخاب Mainnet (نه Testnet)

2. **Refresh Page:**
   ```
   Ctrl + Shift + R (or Cmd + Shift + R)
   ```

3. **Clear Cache:**
   ```
   F12 → Application → Clear Storage → Clear
   ```

4. **Check Internet:**
   - VPN را disable کنید
   - Firewall را چک کنید

5. **Browser Console:**
   ```javascript
   F12 → Console
   // Look for errors:
   [Jupiter] Proxy method failed: ...
   [Jupiter] Direct API call failed: ...
   ```

### Problem: Swap Failed

**Error: "Insufficient balance"**
- Balance کافی ندارید
- SOL برای fee باید بماند (~ 0.001 SOL)

**Error: "Slippage exceeded"**
- Price خیلی تغییر کرده
- Slippage را افزایش دهید (1% یا 2%)
- دوباره quote بگیرید

**Error: "Transaction failed"**
- Network congestion
- Retry after a few seconds
- Priority fee را افزایش دهید

### Problem: Slow Confirmation

**Solutions:**
1. Priority Fee را افزایش دهید (Settings)
2. Network کمتر شلوغ باشد (چک کنید Solana status)
3. صبر کنید 30-60 ثانیه

---

## 💡 Pro Tips:

### 1. Best Price
```
Jupiter automatically finds best route!
شما نیازی نیست manual check کنید
```

### 2. Slippage
```
For stable pairs (USDC/USDT): 0.1% - 0.3%
For volatile pairs (SOL/MEME): 1% - 5%
```

### 3. Timing
```
Best times to swap:
- Low network activity
- Non-peak hours
- Lower gas fees
```

### 4. Large Swaps
```
For > $1000:
1. Check price impact (should be < 1%)
2. Consider splitting into smaller swaps
3. Use higher slippage if needed
```

### 5. Safety
```
✅ Always verify:
- Token addresses
- Output amount
- Price impact
- Transaction signature (on Solscan)
```

---

## 📈 Swap History:

Swap history را ببینید:
1. Activity tab
2. یا در Swap page → Recent Swaps section

هر swap record دارد:
- From Token + Amount
- To Token + Amount
- Exchange Rate
- Fee (SOL + USD)
- Timestamp
- Transaction Signature (link to Solscan)

---

## 🎉 شما آماده‌اید!

**Swap شما کاملاً functional است و مثل Phantom کار می‌کند!**

Features شما دارید:
- ✅ Jupiter Aggregator
- ✅ Best Price Routing
- ✅ Low Slippage
- ✅ Multiple DEX Support
- ✅ Real-time Quotes
- ✅ Price Impact Warnings
- ✅ Biometric Confirmation
- ✅ Transaction History
- ✅ Testnet Support

---

**Happy Swapping!** 🚀
