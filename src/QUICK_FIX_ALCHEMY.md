# ⚡ رفع فوری خطای Alchemy

## مشکل شما:
خطای "Must be authenticated!" از Alchemy دریافت می‌کنید.

## علت:
ALCHEMY_API_KEY در Supabase تنظیم نشده یا نادرست است.

---

## راه حل (3 دقیقه):

### مرحله 1: دریافت API Key

1. **باز کنید:** https://dashboard.alchemy.com
2. **لاگین کنید** با حساب خود
3. اگر App ندارید:
   - کلیک روی **+ Create new app**
   - Chain: `Ethereum`
   - Network: `Ethereum Mainnet`
   - کلیک **Create app**
4. روی App خود کلیک کنید
5. کلیک روی **API key**
6. شما دو چیز می‌بینید:
   - **HTTPS URL** (چیزی شبیه: `https://eth-mainnet.g.alchemy.com/v2/abc123...`)
   - **API KEY** (فقط: `abc123def456...`)

### ⚠️ مهم:
```
❌ این را کپی نکنید:
https://eth-mainnet.g.alchemy.com/v2/abc123def456ghi789

✅ فقط این قسمت را کپی کنید:
abc123def456ghi789
```

**فقط قسمت بعد از `/v2/` را کپی کنید!**

---

### مرحله 2: تنظیم در Supabase

1. **باز کنید:** https://supabase.com/dashboard
2. پروژه Saturn خود را انتخاب کنید
3. از منوی چپ: `Settings` → `Edge Functions`
4. تب `Secrets` را باز کنید

### اگر ALCHEMY_API_KEY وجود دارد:
- روی آیکون 🗑️ کلیک کنید
- تایید کنید

### ساخت Secret جدید:
- کلیک روی `Add new secret`
- در فیلد `Name` بنویسید: `ALCHEMY_API_KEY`
- در فیلد `Value` فقط API key را paste کنید (نه URL)
- کلیک روی `Save`

---

### مرحله 3: صبر کنید

⏱️ **5 دقیقه صبر کنید**

Supabase نیاز دارد تا Edge Function را با Secret جدید restart کند.

---

### مرحله 4: تست کنید

1. به اپلیکیشن Saturn بروید
2. `Settings` → `Dev Mode` را فعال کنید
3. پایین صفحه روی دکمه **"تست API Keys"** کلیک کنید
4. باید ببینید: **Alchemy: معتبر ✅**

---

## هنوز کار نمی‌کند؟

### چک کنید:
- [ ] آیا فقط API key را کپی کردید؟ (نه URL کامل)
- [ ] آیا Secret را با نام دقیق `ALCHEMY_API_KEY` ساختید؟
- [ ] آیا 5 دقیقه صبر کردید؟
- [ ] آیا App شما در Alchemy برای Ethereum Mainnet است؟

### API Key جدید بسازید:
اگر همه چیز را امتحان کردید:
1. در Alchemy یک App کاملاً جدید بسازید
2. API Key جدید بگیرید
3. در Supabase تنظیم کنید

---

## بدون Alchemy

اگر نمی‌خواهید Alchemy تنظیم کنید:
- ✅ اپلیکیشن کار می‌کند
- ❌ موجودی Ethereum نمایش داده نمی‌شود
- ✅ Solana, Bitcoin و سایر ارزها کار می‌کنند

---

## لاگ‌ها

برای دیدن دقیق مشکل:
1. Supabase → Edge Functions → `make-server-e5bc10d1`
2. تب Logs
3. دنبال این پیام‌ها بگردید:
   - `[Alchemy] ❌ Authentication failed`
   - `[Blockchain Check] ❌ Alchemy authentication failed`

---

**نیاز به کمک؟** راهنمای کامل: `ALCHEMY_FIX_NOW.md`
