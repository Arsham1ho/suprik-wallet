# 🚨 راه حل فوری خطای Alchemy "Must be authenticated!"

## ⚡ راه حل سریع (5 دقیقه)

### گام 1️⃣: دریافت API Key صحیح

1. به https://dashboard.alchemy.com بروید و لاگین کنید
2. اگر App ندارید، **Create App** کلیک کنید:
   - Name: `Saturn Wallet`
   - Chain: **Ethereum**
   - Network: **Ethereum Mainnet**
   - کلیک روی **Create App**

3. در لیست Apps، روی App خود کلیک کنید
4. روی دکمه **API Key** کلیک کنید
5. **مهم:** دو نوع URL نشان داده می‌شود:
   - ❌ **HTTPS** (مثلاً: `https://eth-mainnet.g.alchemy.com/v2/abc123...`)
   - ❌ **WSS** (مثلاً: `wss://eth-mainnet.g.alchemy.com/v2/abc123...`)
   
6. ✅ **فقط قسمت بعد از `/v2/` را کپی کنید**

**مثال:**
```
URL کامل: https://eth-mainnet.g.alchemy.com/v2/Abc123Def456Ghi789Jkl012Mno345Pq

چیزی که باید کپی کنید: Abc123Def456Ghi789Jkl012Mno345Pq
```

### گام 2️⃣: تنظیم در Supabase

1. به پنل Supabase بروید: https://supabase.com/dashboard
2. پروژه Saturn خود را باز کنید
3. از منوی سمت چپ: **Settings** → **Edge Functions**
4. به تب **Secrets** بروید

### گام 3️⃣: حذف Secret قبلی (اگر وجود دارد)

اگر قبلاً `ALCHEMY_API_KEY` ساخته‌اید:
1. آن را پیدا کنید در لیست
2. روی آیکون 🗑️ (Delete) کلیک کنید
3. تایید کنید

### گام 4️⃣: ساخت Secret جدید

1. روی **Add New Secret** کلیک کنید
2. فیلدها را پر کنید:
   ```
   Name: ALCHEMY_API_KEY
   Value: [فقط API key از گام 1 را paste کنید]
   ```
3. ✅ **دوباره چک کنید:** مطمئن شوید که:
   - `https://` در ابتدا **ندارد**
   - `/v2/` در ابتدا **ندارد**
   - فقط یک رشته حروف و اعداد است (حدود 32 کاراکتر)

4. روی **Save** کلیک کنید

### گام 5️⃣: صبر کنید و تست کنید

1. **5 دقیقه صبر کنید** (Supabase نیاز به زمان دارد تا Edge Function را restart کند)
2. به اپلیکیشن Saturn بروید
3. **Settings** → **Dev Mode** را فعال کنید
4. پایین صفحه روی **تست API Keys** کلیک کنید
5. باید پیام **Alchemy: معتبر ✅** را ببینید

---

## ❓ هنوز کار نمی‌کند؟

### بررسی 1: مطمئن شوید Network صحیح است

در Alchemy App:
- Chain باید **Ethereum** باشد
- Network باید **Mainnet** باشد (نه Sepolia یا Goerli)

### بررسی 2: App فعال است؟

1. در Alchemy Dashboard به Apps بروید
2. مطمئن شوید App شما **Active** است
3. اگر **Suspended** یا **Inactive** است، آن را فعال کنید

### بررسی 3: API Key جدید بسازید

گاهی API Key کهنه مشکل دارد. یک کلید جدید بسازید:

1. در Alchemy App روی **Settings** کلیک کنید
2. به بخش **API Keys** بروید
3. روی **Create New API Key** کلیک کنید
4. کلید جدید را کپی کنید و در Supabase تنظیم کنید

### بررسی 4: لاگ‌های Edge Function

برای دیدن دقیق مشکل:

1. در Supabase به **Edge Functions** بروید
2. روی `make-server-e5bc10d1` کلیک کنید
3. تب **Logs** را باز کنید
4. دنبال این پیام‌ها بگردید:
   ```
   [Alchemy] Raw API key length: XX
   [Alchemy] API key starts with: ...
   [Alchemy] API error: { code: -32600, message: "Must be authenticated!" }
   ```

اگر می‌بینید:
- `API key length: 100+` → احتمالاً URL کامل را paste کرده‌اید
- `API key length: < 20` → API key اشتباه است
- `API key length: 30-40` → احتمالاً درست است، اما نامعتبر

---

## 💡 نکات مهم

### ✅ چیزهایی که باید بدانید:
- Alchemy رایگان است (300M CU/ماه)
- تنها Ethereum و EVM chains را پشتیبانی می‌کند
- API Key نباید هیچ‌وقت در کد frontend باشد
- هر تغییر در Secrets نیاز به 5-10 دقیقه زمان دارد

### ⚠️ اشتباهات رایج:
- ❌ کپی کردن `https://eth-mainnet.g.alchemy.com/v2/abc123`
- ❌ کپی کردن فقط `https://eth-mainnet.g.alchemy.com`
- ❌ استفاده از API Key برای testnet در production
- ❌ نذاشتن فاصله زمانی بعد از تغییر Secret

### ✅ فرمت صحیح:
```
فقط این قسمت: abc123def456ghi789jkl012mno345pq
```

---

## 🆘 اگر هیچ‌کدام کار نکرد

اگر همه مراحل بالا را انجام دادید و هنوز خطا می‌گیرید:

1. **ایجاد حساب Alchemy جدید:**
   - با ایمیل دیگری حساب جدید بسازید
   - App جدید بسازید
   - از API Key جدید استفاده کنید

2. **بدون Alchemy کار کنید:**
   - اپلیکیشن Saturn بدون Alchemy هم کار می‌کند
   - فقط موجودی Ethereum نشان داده نمی‌شود
   - Solana و Bitcoin به API های دیگر متصل هستند

3. **استفاده از Infura (جایگزین):**
   - می‌توانید از Infura به جای Alchemy استفاده کنید
   - ولی نیاز به تغییر کد دارد

---

## 📞 پشتیبانی

اگر مشکل حل نشد، لاگ‌های زیر را بررسی کنید:

```
Supabase → Edge Functions → make-server-e5bc10d1 → Logs
```

و دنبال این خطاها بگردید:
- `[Blockchain Check] API Keys status`
- `[Alchemy] Raw API key length`
- `[Alchemy] API error`

این اطلاعات به شما کمک می‌کند تا دقیقاً بفهمید مشکل کجاست.
