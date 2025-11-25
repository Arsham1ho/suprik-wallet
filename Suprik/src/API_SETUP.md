# Saturn Wallet - API Keys Setup Guide 🔑

این راهنما نحوه تنظیم API Keys برای blockchain services را توضیح می‌دهد.

---

## ⚠️ خطاهای رایج

### خطا: "Failed to fetch tokens: 503"
این به معنای **Alchemy API در دسترس نیست** یا **API key اشتباه است**.

### خطا: "ALCHEMY_API_KEY not configured"
API key در Supabase تنظیم نشده است.

---

## 📋 API Keys مورد نیاز

Saturn Wallet به این API keys نیاز دارد:

| Service | Purpose | Required? | Free Tier? |
|---------|---------|-----------|------------|
| **Helius** | Solana blockchain data | ✅ Yes | ✅ Yes (100k req/day) |
| **Alchemy** | Ethereum blockchain data | ✅ Yes | ✅ Yes (300M units/month) |
| **Resend** | Email notifications | ⚪ Optional | ✅ Yes (100 emails/day) |

---

## 🔑 دریافت API Keys

### 1. Helius API Key (برای Solana)

#### مرحله ۱: ثبت‌نام
1. به https://helius.dev بروید
2. روی "Start Building" کلیک کنید
3. با Google/GitHub ثبت‌نام کنید

#### مرحله ۲: ساخت API Key
1. وارد Dashboard شوید
2. به "API Keys" بروید
3. روی "Create New Key" کلیک کنید
4. نام: "Saturn Wallet"
5. API Key را کپی کنید

#### مرحله ۳: تنظیم در Supabase
```bash
# در Supabase Dashboard:
# Settings → Edge Functions → Secrets → Add new secret

Name: HELIUS_API_KEY
Value: [paste your key here]
```

**نکات مهم**:
- ✅ Free tier: 100,000 requests/day
- ✅ برای development کافی است
- ✅ برای production هم مناسب است

---

### 2. Alchemy API Key (برای Ethereum)

#### مرحله ۱: ثبت‌نام
1. به https://www.alchemy.com بروید
2. روی "Get Started Free" کلیک کنید
3. ثبت‌نام کنید (email یا Google)

#### مرحله ۲: ساخت App
1. وارد Dashboard شوید
2. روی "+ Create new app" کلیک کنید
3. تنظیمات:
   - **Chain**: Ethereum
   - **Network**: 
     - Mainnet (برای production)
     - Sepolia (برای testing)
   - **Name**: Saturn Wallet
4. روی "Create app" کلیک کنید

#### مرحله ۳: دریافت API Key
1. روی app ساخته شده کلیک کنید
2. روی "API Key" کلیک کنید
3. API Key را کپی کنید (بدون `https://eth-mainnet.g.alchemy.com/v2/`)
4. فقط قسمت آخر مثل: `abc123def456...`

#### مرحله ۴: تنظیم در Supabase
```bash
# در Supabase Dashboard:
# Settings → Edge Functions → Secrets → Add new secret

Name: ALCHEMY_API_KEY
Value: [paste your key here - فقط کد API نه URL کامل]
```

**نکات مهم**:
- ✅ Free tier: 300 Million compute units/month
- ✅ کافی برای هزاران request
- ⚠️ اگر Mainnet و Sepolia هر دو می‌خواهید، یک app بسازید و network را Mainnet قرار دهید (همه networks را پوشش می‌دهد)

---

### 3. Resend API Key (اختیاری - برای Email)

#### مرحله ۱: ثبت‌نام
1. به https://resend.com بروید
2. روی "Start Building" کلیک کنید
3. ثبت‌نام کنید

#### مرحله ۲: دریافت API Key
1. وارد Dashboard شوید
2. به "API Keys" بروید
3. روی "Create API Key" کلیک کنید
4. نام: "Saturn Wallet"
5. API Key را کپی کنید

#### مرحله ۳: تنظیم در Supabase
```bash
Name: RESEND_API_KEY
Value: [paste your key here]
```

**نکات**:
- ⚪ اختیاری - فقط برای email notifications
- ✅ Free tier: 100 emails/day

---

## 🚀 نصب در Supabase

### روش ۱: از طریق Dashboard (توصیه می‌شود)

1. **وارد Supabase شوید**:
   ```
   https://supabase.com/dashboard
   ```

2. **پروژه خود را انتخاب کنید**

3. **به Settings بروید**:
   ```
   Settings (⚙️) → Edge Functions
   ```

4. **به بخش Secrets بروید**:
   ```
   پایین صفحه → Secrets section
   ```

5. **اضافه کردن هر API Key**:
   - روی "Add new secret" کلیک کنید
   - Name وارد کنید: `HELIUS_API_KEY`
   - Value وارد کنید: کلید واقعی
   - Save کنید
   - تکرار برای `ALCHEMY_API_KEY` و `RESEND_API_KEY`

6. **تأیید**:
   - لیست secrets باید شامل این ها باشد:
     - ✅ `HELIUS_API_KEY`
     - ✅ `ALCHEMY_API_KEY`
     - ⚪ `RESEND_API_KEY` (اختیاری)

---

### روش ۲: از طریق CLI (پیشرفته)

```bash
# نصب Supabase CLI
npm install -g supabase

# Login
supabase login

# Link به پروژه
supabase link --project-ref [your-project-id]

# Set secrets
supabase secrets set HELIUS_API_KEY=your_helius_key_here
supabase secrets set ALCHEMY_API_KEY=your_alchemy_key_here
supabase secrets set RESEND_API_KEY=your_resend_key_here

# تأیید
supabase secrets list
```

---

## ✅ تست API Keys

### تست کردن در اپ:

1. **اپ را باز کنید**

2. **Console را باز کنید** (F12)

3. **به دنبال این پیام‌ها بگردید**:
   ```
   ═══════════════════════════════════════════════════════════
   📦 API Keys Status:
     • Helius (Solana): ✅ Configured
     • Alchemy (Ethereum): ✅ Configured
   ═══════════════════════════════════════════════════════════
   ```

4. **اگر ❌ می‌بینید**:
   - API key تنظیم نشده
   - Edge Function را restart کنید
   - Secrets را دوباره بررسی کنید

### تست Manual:

```javascript
// در Browser Console:

// تست Helius (Solana)
fetch('https://[your-project].supabase.co/functions/v1/make-server-e5bc10d1/api-status', {
  headers: {
    'Authorization': 'Bearer [your-anon-key]'
  }
})
.then(r => r.json())
.then(data => console.log('API Status:', data));
```

---

## 🔧 Troubleshooting

### ❌ خطا: "503 Service Unavailable"

**علت**: Alchemy API down است یا rate limit

**راه‌حل**:
1. صبر کنید 30-60 ثانیه
2. به https://status.alchemy.com بروید
3. بررسی کنید که API key درست است
4. اگر مشکل ادامه دارد، API key جدید بسازید

---

### ❌ خطا: "ALCHEMY_API_KEY not configured"

**علت**: Environment variable تنظیم نشده

**راه‌حل**:
1. به Supabase Dashboard بروید
2. Settings → Edge Functions → Secrets
3. بررسی کنید `ALCHEMY_API_KEY` موجود است
4. اگر نیست، اضافه کنید
5. Edge Function را restart کنید:
   ```bash
   # Option 1: از Dashboard
   # Settings → Edge Functions → Restart
   
   # Option 2: Deploy دوباره
   # تغییری در کد بدهید و save کنید
   ```

---

### ❌ خطا: "Invalid API Key"

**علت**: API key اشتباه یا منقضی شده

**راه‌حل**:
1. به Dashboard سرویس بروید (Helius/Alchemy)
2. API key جدید بسازید
3. در Supabase Secrets update کنید
4. چند دقیقه صبر کنید (propagation)

---

### ⚠️ Warning: "Ethereum balance will not work"

**معنی**: Alchemy API key تنظیم نشده، اما اپ کار می‌کند

**تأثیر**:
- ✅ Solana کار می‌کند
- ❌ Ethereum balance صفر نمایش می‌دهد
- ❌ ERC20 tokens نمایش داده نمی‌شوند

**راه‌حل**: ALCHEMY_API_KEY را تنظیم کنید (بالا)

---

## 📊 محدودیت‌های Free Tier

### Helius (Solana):
- ✅ **100,000 requests/day**
- ✅ تمام RPC methods
- ✅ Enhanced transactions
- ✅ Webhook support

**برای Saturn Wallet کافی است؟**
- ✅ بله! حتی برای صدها کاربر

---

### Alchemy (Ethereum):
- ✅ **300 Million compute units/month**
- ✅ تمام chains (Ethereum, Polygon, Arbitrum, etc.)
- ✅ Archive data
- ✅ WebSocket support

**Compute Units چیست؟**
- `eth_getBalance`: 19 units
- `alchemy_getTokenBalances`: 70 units
- `alchemy_getTokenMetadata`: 50 units

**مثال محاسبه**:
```
1 user checking balance:
  - ETH balance: 19 units
  - 5 ERC20 tokens: 70 + (5 × 50) = 320 units
  - Total: ~340 units per check

300M units ÷ 340 = ~880,000 balance checks/month
```

**برای Saturn Wallet کافی است؟**
- ✅ بله! برای هزاران کاربر

---

## 🔒 امنیت API Keys

### ✅ انجام دهید:
- API keys را در Supabase Secrets نگه دارید
- API keys را در `.env` files commit نکنید
- Key rotation را برای production فعال کنید
- Rate limiting را monitor کنید

### ❌ انجام ندهید:
- API keys را در کد frontend قرار ندهید
- API keys را در public repositories بگذارید
- API keys را به اشتراک بگذارید
- همه permissions را بدهید (فقط لازم ها)

---

## 📞 نیاز به کمک؟

### منابع:
- **Helius Docs**: https://docs.helius.dev
- **Alchemy Docs**: https://docs.alchemy.com
- **Resend Docs**: https://resend.com/docs

### پشتیبانی:
- GitHub Issues
- Discord Community
- Email: support@saturn-wallet.com

---

## ✅ Checklist نهایی

قبل از launch اپ، بررسی کنید:

- [ ] Helius API Key تنظیم شده
- [ ] Alchemy API Key تنظیم شده
- [ ] API Keys در Supabase Secrets موجود است
- [ ] Console logs "✅ Configured" نمایش می‌دهد
- [ ] Solana balance کار می‌کند
- [ ] Ethereum balance کار می‌کند
- [ ] Tokens نمایش داده می‌شوند
- [ ] Transaction history کار می‌کند
- [ ] Swap functionality کار می‌کند
- [ ] API keys در git commit نشده

---

🎉 **آماده است!** حالا Saturn Wallet شما به blockchain متصل است و آماده استفاده! 🪐✨
