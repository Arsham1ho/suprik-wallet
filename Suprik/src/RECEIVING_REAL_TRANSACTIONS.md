# دریافت تراکنش‌های واقعی بلاکچین (Receiving Real Blockchain Transactions)

## مشکل شما (Your Issue)
شما 1 سولانا از کیف پول Phantom (در حالت testnet/devnet) به آدرس سولانای کیف پول Saturn خود ارسال کرده‌اید، اما موجودی در کیف پول Saturn ظاهر نمی‌شود.

## چک‌لیست حل مشکل (Troubleshooting Checklist)

### 1️⃣ بررسی شبکه سولانا (Check Solana Network)
کیف پول Saturn شما باید روی همان شبکه‌ای باشد که Phantom استفاده می‌کند:

- اگر Phantom روی **Devnet** است → Saturn هم باید روی **Devnet** باشد
- اگر Phantom روی **Mainnet** است → Saturn هم باید روی **Mainnet** باشد

**چطور تنظیم کنم؟**
1. به صفحه Home بروید
2. Alert box بنفش بالای صفحه را ببینید (با عنوان "Network Selector")
3. از dropdown شبکه مورد نظر را انتخاب کنید (Devnet برای تست)

### 2️⃣ بررسی آدرس سولانا (Verify Solana Address)
مطمئن شوید که دقیقاً به همان آدرسی که Saturn نمایش می‌دهد، ارسال کرده‌اید:

1. در Saturn، دکمه **"Receive"** را بزنید
2. آدرس سولانا را کپی کنید
3. مطمئن شوید که این دقیقاً همان آدرسی است که در Phantom استفاده کردید

### 3️⃣ صبر کنید و Refresh کنید (Wait & Refresh)
تراکنش‌های بلاکچین ممکن است چند ثانیه طول بکشند:

1. **منتظر بمانید**: 30-60 ثانیه صبر کنید
2. **Refresh دستی**: دکمه Refresh (آیکون چرخشی) در گوشه بالا راست صفحه Home را بزنید
3. **Auto-refresh**: Saturn هر 30 ثانیه به صورت خودکار بلاکچین را بررسی می‌کند

### 4️⃣ بررسی Console Logs (Check Browser Console)
برای دیباگ دقیق:

1. **F12** یا کلیک راست → **Inspect** → تب **Console**
2. دکمه Refresh را در Saturn بزنید
3. به دنبال این پیام‌ها باشید:

```
========== SOLANA BLOCKCHAIN CHECK ==========
Network: devnet (یا mainnet)
Address: [آدرس شما]
Current stored SOL amount: [موجودی فعلی]
Fetched Solana balance from blockchain: [موجودی جدید]
Balance changed! Change amount: [تغییر]
Saving tokens to database: {...}
Tokens saved successfully
```

### 5️⃣ تأیید Helius API Key (Verify Helius API)
بدون Helius API key، Saturn نمی‌تواند بلاکچین سولانا را چک کند:

**در Console به دنبال این بگردید:**
```
Helius API key configured: true
```

اگر `false` است:
- Helius API key در environment variables تنظیم نشده است
- از مستندات `DEVNET_GUIDE.md` برای راه‌اندازی استفاده کنید

### 6️⃣ بررسی تراکنش در Solana Explorer
تأیید کنید که تراکنش واقعاً انجام شده است:

**برای Devnet:**
1. به https://explorer.solana.com/?cluster=devnet بروید
2. آدرس کیف پول Saturn خود را جستجو کنید
3. ببینید آیا تراکنش شما در لیست است

**برای Mainnet:**
1. به https://explorer.solana.com/ بروید
2. آدرس را جستجو کنید

## مراحل دقیق تست با Devnet

### مرحله 1: تنظیم شبکه در Phantom
1. Phantom wallet را باز کنید
2. Settings → Developer Settings → Testnet Mode را فعال کنید
3. یا Network را به "Devnet" تغییر دهید

### مرحله 2: دریافت Devnet SOL رایگان
1. به https://faucet.solana.com بروید
2. آدرس Phantom devnet خود را وارد کنید
3. "Confirm Airdrop" بزنید
4. 1-2 SOL رایگان دریافت کنید

### مرحله 3: تنظیم Saturn روی Devnet
1. Saturn → Home page
2. در Alert box بنفش "Network Selector" را ببینید
3. از dropdown "Devnet" را انتخاب کنید
4. منتظر بمانید تا "Devnet Mode Active ✅" نشان داده شود

### مرحله 4: دریافت آدرس Saturn
1. دکمه "Receive" را بزنید
2. تب "Solana" را انتخاب کنید
3. آدرس را کپی کنید (یا QR code را اسکن کنید)

### مرحله 5: ارسال از Phantom
1. Phantom را باز کنید (مطمئن شوید Devnet است)
2. "Send" را بزنید
3. آدرس Saturn را paste کنید
4. مقدار (مثلاً 1 SOL) را وارد کنید
5. "Next" → "Send" → تأیید کنید

### مرحله 6: صبر و Refresh
1. 30-60 ثانیه صبر کنید
2. در Saturn، دکمه Refresh (بالا راست) را بزنید
3. Console را باز کنید (F12) و logs را ببینید

## خطاهای متداول (Common Errors)

### ❌ "Helius API key configured: false"
**راه حل:** Helius API key را در environment variables تنظیم کنید
- به `DEVNET_GUIDE.md` مراجعه کنید

### ❌ "Network: mainnet" (وقتی Phantom روی devnet است)
**راه حل:** Saturn را روی Devnet تنظیم کنید از طریق Network Selector

### ❌ "Fetched Solana balance from blockchain: 0"
**احتمالات:**
1. تراکنش هنوز confirm نشده (صبر کنید)
2. آدرس اشتباه است (دوباره چک کنید)
3. شبکه‌ها match نمی‌کنند (Phantom=devnet, Saturn=mainnet)

### ❌ موجودی بعد از Refresh به صفر می‌رود
**وضعیت:** این یک bug بود که الان fix شده است
**راه حل:** صفحه را refresh کنید (F5)

## اطلاعات فنی (Technical Details)

### چطور کار می‌کند؟
1. **Auto Check (هر 30 ثانیه)**: Saturn به صورت خودکار Helius RPC API را صدا می‌زند
2. **Manual Refresh**: وقتی دکمه Refresh را می‌زنید، بلافاصله چک می‌شود
3. **Balance Comparison**: موجودی فعلی با موجودی بلاکچین مقایسه می‌شود
4. **Activity Creation**: اگر تغییری باشد، یک activity جدید ایجاد می‌شود

### Helius API Endpoints
- **Mainnet:** `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`
- **Devnet:** `https://devnet.helius-rpc.com/?api-key=YOUR_KEY`

### کد مربوطه
- **Frontend:** `/components/pages/Home.tsx` → `checkBlockchainTransactions()`
- **Backend:** `/supabase/functions/server/index.tsx` → `/check-blockchain-transactions`
- **Balance Checker:** `checkSolanaBalance()` function

## هنوز کار نمی‌کند؟ (Still Not Working?)

1. **همه Console Logs را کپی کنید**
2. **Screenshot از Phantom transaction history بگیرید**
3. **Screenshot از Solana Explorer بگیرید**
4. **آدرس کیف پول را چک کنید** (در Receive dialog)
5. **شبکه فعلی را چک کنید** (باید در logs نمایش داده شود)

این اطلاعات به شما کمک می‌کند مشکل را شناسایی کنید.

---

## Dev Mode vs Real Blockchain

⚠️ **تفاوت مهم:**

### Dev Mode (شبیه‌سازی)
- از Settings فعال می‌شود
- از dialog "Simulate Transaction" استفاده می‌کنید
- هیچ بلاکچین واقعی درگیر نیست
- فوری است (بدون انتظار)
- فقط برای تست UI

### Real Blockchain (Devnet/Mainnet)
- از Network Selector در Home استفاده می‌کنید
- از Phantom یا کیف پول‌های دیگر ارسال می‌کنید
- تراکنش واقعی روی بلاکچین
- 30-60 ثانیه طول می‌کشد
- نیاز به API key دارد (Helius)
