# 🔧 راهنمای رفع خطای "Must be authenticated!" در Alchemy

این راهنما به شما کمک می‌کند خطای authentication Alchemy را برطرف کنید.

## ❌ خطای "Must be authenticated!"

این خطا به معنای این است که Alchemy API key شما نادرست است یا به درستی تنظیم نشده.

---

## راه حل‌ها (به ترتیب اولویت)

### راه حل 1️⃣: بررسی فرمت API Key

**مشکل رایج:** کپی کردن URL کامل به جای API Key

#### ✅ فرمت صحیح:
```
abc123def456ghi789jkl012mno345pq
```
(یک رشته 32+ کاراکتری بدون فاصله و URL)

#### ❌ فرمت اشتباه (رایج):
```
https://eth-mainnet.g.alchemy.com/v2/abc123def456ghi789jkl012mno345pq
```

**اگر اشتباهاً URL کامل را کپی کردید:**
- فقط قسمت **بعد از `/v2/`** را استفاده کنید
- یعنی: `abc123def456ghi789jkl012mno345pq`

---

### راه حل 2️⃣: حذف و ساخت مجدد Secret در Supabase

گاهی Supabase Secret به درستی ذخیره نمی‌شود. برای رفع این مشکل:

#### مراحل:
1. به پنل Supabase بروید
2. **Settings** → **Edge Functions** → **Secrets**
3. Secret با نام `ALCHEMY_API_KEY` را پیدا کنید
4. روی آیکون **Delete** (🗑️) کلیک کنید
5. روی **Add New Secret** کلیک کنید:
   - Name: `ALCHEMY_API_KEY`
   - Value: [API key شما از Alchemy]
6. روی **Save** کلیک کنید
7. چند دقیقه صبر کنید تا Edge Function دوباره deploy شود

---

### راه حل 3️⃣: دریافت API Key جدید از Alchemy

اگر راه‌های قبلی کار نکرد، یک API Key جدید بگیرید:

#### مراحل:
1. به https://www.alchemy.com بروید و لاگین کنید
2. روی **Apps** کلیک کنید
3. اگر قبلاً App دارید، از آن استفاده کنید. در غیر این صورت:
   - روی **Create App** کلیک کنید
   - Name: `Saturn Wallet`
   - Chain: **Ethereum**
   - Network: **Mainnet**
   - روی **Create App** کلیک کنید
4. روی App خود کلیک کنید
5. در بخش **API Key**، روی **View Key** کلیک کنید
6. **فقط API Key** را کپی کنید (نه HTTPS URL)
   
   مثال: کلیدی که باید کپی کنید شبیه این است:
   ```
   AbC123dEf456GhI789jKl012MnO345pQ
   ```

7. به Supabase بروید و Secret را طبق راه حل 2 تنظیم کنید

---

### راه حل 4️⃣: بررسی Network

مطمئن شوید که App شما در Alchemy برای **Ethereum Mainnet** ساخته شده است.

اگر App شما برای **Testnet** (مثل Sepolia) است، باید کد سرور را تغییر دهید که فعلاً پشتیبانی نمی‌شود.

---

## تست API Key

بعد از تنظیم Secret:

1. وارد اپلیکیشن Saturn شوید
2. به **Settings** → **Dev Mode** بروید
3. روی **Blockchain Setup** کلیک کنید
4. روی دکمه **تست API Keys** کلیک کنید
5. باید پیام **Alchemy: Valid ✅** را ببینید

اگر هنوز خطا می‌دهد، لاگ‌های سرور را بررسی کنید (در Supabase Dashboard → Edge Functions → Logs).

---

## نکات مهم

### ✅ چک لیست تنظیم صحیح:
- [ ] API Key فقط یک رشته است (بدون `https://` یا `/v2/`)
- [ ] Secret در Supabase با نام دقیق `ALCHEMY_API_KEY` ساخته شده
- [ ] App در Alchemy برای Ethereum Mainnet است
- [ ] چند دقیقه بعد از تنظیم Secret صبر کردید

### 🔐 امنیت:
- API Key را **هیچ‌وقت** در کد frontend قرار ندهید
- فقط در Supabase Secrets ذخیره کنید
- API Key را در git commit نکنید

### 💰 رایگان:
Alchemy تا **300 میلیون Compute Units** در ماه رایگان است که برای اکثر کاربران کافی است.

---

## هنوز مشکل دارید?

اگر بعد از امتحان تمام راه‌های بالا هنوز خطا می‌گیرید:

1. لاگ‌های Edge Function را بررسی کنید:
   ```
   Supabase Dashboard → Edge Functions → make-server-e5bc10d1 → Logs
   ```

2. دنبال این پیام‌ها بگردید:
   ```
   [Blockchain Check] Checking Ethereum balance
   [Alchemy] API error: Must be authenticated!
   ```

3. طول API Key را بررسی کنید:
   - باید حدود 32 کاراکتر باشد
   - اگر خیلی کوتاه یا خیلی بلند است، احتمالاً اشتباه است

4. یک App کاملاً جدید در Alchemy بسازید و از API Key آن استفاده کنید
