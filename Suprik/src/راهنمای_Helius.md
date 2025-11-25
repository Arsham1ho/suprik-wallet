# 🔑 راهنمای نصب API کلید Helius - کیف پول Saturn

## 📋 پیکربندی جدید Helius

**کلید API**: `e7ec6503-c9b2-4c0b-ae5f-3646622d4896`

### 🌐 آدرس‌های RPC

#### Mainnet (شبکه اصلی)
```
https://mainnet.helius-rpc.com/?api-key=e7ec6503-c9b2-4c0b-ae5f-3646622d4896
```

#### Devnet (شبکه تست)
```
https://devnet.helius-rpc.com/?api-key=e7ec6503-c9b2-4c0b-ae5f-3646622d4896
```

---

## ✅ نصب کامل شد

کلید API هیلیوس به secrets سوپابیس شما با نام `HELIUS_API_KEY` اضافه شد.

### نحوه کار

سرور به صورت خودکار URL صحیح RPC را بر اساس حالت شبکه می‌سازد:

```typescript
// کد سرور (از قبل پیاده‌سازی شده)
const HELIUS_API_KEY = Deno.env.get('HELIUS_API_KEY');

// Mainnet
const mainnetUrl = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Devnet
const devnetUrl = `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
```

---

## 🧪 تست کلید API شما

### 1. تست سریع از طریق ترمینال

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

**پاسخ مورد انتظار**:
```json
{
  "jsonrpc": "2.0",
  "result": "ok",
  "id": 1
}
```

### 2. تست در کیف پول Saturn

1. کیف پول Saturn خود را باز کنید
2. یک کیف پول ایجاد کنید یا باز کنید
3. Console را بررسی کنید - باید ببینید:
   ```
   [Solana] 🔗 Fetching balance from MAINNET for...
   [Solana] ✅ MAINNET Balance: X.XXXXXX SOL
   ```

### 3. بررسی وضعیت API

Console مرورگر را باز کنید و اجرا کنید:
```javascript
fetch('https://YOUR_PROJECT.supabase.co/functions/v1/make-server-e5bc10d1/api-status')
  .then(r => r.json())
  .then(console.log)

// انتظار: { helius: true, alchemy: true }
```

---

## 📊 ویژگی‌های API هیلیوس

### متدهای RPC موجود

| متد | هدف | استفاده توسط |
|-----|------|-------------|
| `getBalance` | دریافت موجودی SOL | ✅ صفحه اصلی |
| `getTokenAccountsByOwner` | دریافت توکن‌های SPL | ✅ صفحه اصلی |
| `getAsset` (DAS API) | متادیتای توکن | ✅ نمایش توکن |
| `getSignaturesForAddress` | تاریخچه تراکنش | ✅ صفحه فعالیت |
| `sendTransaction` | ارسال SOL/توکن | ✅ صفحه ارسال |
| `getTransaction` | جزئیات تراکنش | ✅ صفحه فعالیت |
| `getRecentBlockhash` | برای امضا | ✅ صفحه ارسال |

### محدودیت‌های نرخ (نسخه رایگان)

- **درخواست در ثانیه**: 100
- **درخواست در روز**: نامحدود
- **اتصالات WebSocket**: 10
- **پاسخ محدودیت نرخ**: 429 Too Many Requests

### گزینه‌های ارتقا

اگر به بیشتر نیاز دارید:
- **Developer**: 1000 RPS، $99/ماه
- **Professional**: 2500 RPS، $249/ماه
- **Enterprise**: سفارشی، تماس با فروش

---

## 🎯 استفاده فعلی

کیف پول Saturn از Helius برای موارد زیر استفاده می‌کند:

### 1. دریافت موجودی (هر 10 ثانیه)
```typescript
// به‌روزرسانی خودکار مثل Phantom
setInterval(() => {
  fetchSolanaBalance(address, 'mainnet');
}, 10000);
```

### 2. کشف توکن
```typescript
// تمام توکن‌های SPL در کیف پول را پیدا می‌کند
getTokenAccountsByOwner(address, {
  programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
})
```

### 3. متادیتای توکن
```typescript
// نام، نماد، لوگوی توکن را از طریق DAS API دریافت می‌کند
getAsset({ id: mintAddress })
```

### 4. تاریخچه تراکنش
```typescript
// 10 تراکنش آخر
getSignaturesForAddress(address, { limit: 10 })
```

---

## 🔐 بهترین شیوه‌های امنیتی

### ✅ انجام دهید:
- ✅ کلید API را در secrets سوپابیس ذخیره کنید (انجام شده)
- ✅ فقط در سمت سرور استفاده کنید (پیاده‌سازی شده)
- ✅ استفاده را در داشبورد Helius مانیتور کنید
- ✅ در صورت افشا، کلید را تغییر دهید

### ❌ انجام ندهید:
- ❌ کلید API را در Git commit نکنید
- ❌ در کد frontend منتشر نکنید
- ❌ به صورت عمومی به اشتراک نگذارید
- ❌ در درخواست‌های سمت کلاینت استفاده نکنید

---

## 📈 مانیتورینگ استفاده

### داشبورد Helius
1. به آدرس بروید: https://dashboard.helius.dev
2. با حساب خود وارد شوید
3. مشاهده کنید:
   - درخواست در ثانیه
   - استفاده روزانه
   - نرخ خطا
   - متدهای برتر فراخوانی شده

### لاگ‌های کیف پول Saturn

Console مرورگر را برای موارد زیر بررسی کنید:
```
[Solana] 🔗 Fetching balance from MAINNET...
[Solana] ✅ MAINNET Balance: 1.234567 SOL
[Solana] ✅ Found 5 SPL tokens
```

لاگ‌های سرور را بر��سی کنید:
```
POST /make-server-e5bc10d1/solana-balance
Status: 200
Response time: 450ms
```

---

## 🛠️ عیب‌یابی

### خطا: "HELIUS_API_KEY not configured"

**راه‌حل**: مطمئن شوید که کلید API را در مودال secret سوپابیس که ظاهر شد وارد کرده‌اید.

### خطا: 429 Too Many Requests

**علت**: از محدودیت 100 درخواست در ثانیه فراتر رفته‌اید.

**راه‌حل‌ها**:
1. فاصله refresh را افزایش دهید (در حال حاضر 10 ثانیه)
2. صف‌بندی درخواست اضافه کنید
3. به نسخه Developer ارتقا دهید

### خطا: "Invalid API key"

**بررسی کنید**:
1. کلید API صحیح است: `e7ec6503-c9b2-4c0b-ae5f-3646622d4896`
2. فضای اضافی در secret سوپابیس وجود ندارد
3. کلید در داشبورد Helius فعال است

### موجودی نمایش داده نمی‌شود

**مراحل دیباگ**:
1. Console مرورگر را باز کنید
2. به دنبال لاگ‌های Solana بگردید
3. تب Network را برای درخواست‌های ناموفق بررسی کنید
4. آدرس کیف پول را تأیید کنید که صحیح است

---

## 🎉 آنچه اکنون کار می‌کند

با این کلید API هیلیوس، کیف پول Saturn شما می‌تواند:

✅ **دریافت موجودی SOL**
- موجودی mainnet به صورت real-time
- موجودی devnet برای تست

✅ **نمایش توکن‌های SPL**
- USDC، USDT و تمام توکن‌های SPL
- لوگو و متادیتای توکن‌ها
- قیمت‌های real-time

✅ **تاریخچه تراکنش**
- 10 تراکنش آخر
- جزئیات ارسال/دریافت
- وضعیت تراکنش

✅ **ارسال تراکنش**
- ارسال SOL
- ارسال توکن‌های SPL
- امضای تراکنش

✅ **Swap توکن‌ها**
- یکپارچگی Jupiter
- قیمت‌های real-time
- swap های واقعی روی mainnet

---

## 📞 پشتیبانی

### پشتیبانی Helius
- داشبورد: https://dashboard.helius.dev
- مستندات: https://docs.helius.dev
- Discord: https://discord.gg/helius

### مشکلات کیف پول Saturn
- `/TROUBLESHOOTING.md` را بررسی کنید
- لاگ‌های console را مرور کنید
- ابتدا با devnet تست کنید

---

## 🚀 مراحل بعدی

### فوری (اکنون کار می‌کند)
1. ✅ موجودی SOL روی Mainnet
2. ✅ نمایش توکن SPL
3. ✅ ارسال/دریافت
4. ✅ تاریخچه تراکنش
5. ✅ Jupiter swaps

### به زودی (هنگام فعال‌سازی)
1. 🔄 پشتیبانی از Bitcoin
2. 🔄 پشتیبانی از Ethereum
3. 🔄 Swap های چند زنجیره‌ای

---

**کلید API**: `e7ec6503-c9b2-4c0b-ae5f-3646622d4896`  
**شبکه**: Solana Mainnet و Devnet  
**ارائه‌دهنده**: Helius  
**وضعیت**: ✅ فعال  
**آخرین به‌روزرسانی**: 17 نوامبر 2024
