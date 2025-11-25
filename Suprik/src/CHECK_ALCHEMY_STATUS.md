# ✅ چک کردن وضعیت Alchemy API

## 🎯 راه‌های چک کردن:

---

## روش 1️⃣: از طریق اپلیکیشن Saturn (بهترین روش)

### مراحل:
1. به اپلیکیشن Saturn بروید
2. از Bottom Navigation روی **⚙️ Settings** کلیک کنید
3. پایین اسکرول کنید تا قسمت **"Developer Options"**
4. اگر **Dev Mode** خاموش است، آن را روشن کنید
5. بعد از روشن شدن Dev Mode، بخش جدیدی ظاهر می‌شود: **"تست API Keys"**
6. روی دکمه **"تست API Keys"** کلیک کنید
7. صبر کنید تا تست کامل شود (5-10 ثانیه)

### نتایج:
```
✅ Alchemy: معتبر
   → همه چیز کار می‌کند!

❌ Alchemy: نامعتبر
   → مشکل دارد، باید رفع شود

⚠️ Alchemy: تنظیم نشده  
   → API key وارد نشده است
```

---

## روش 2️⃣: از طریق Browser Console

### مراحل:
1. به اپلیکیشن Saturn بروید
2. کلید **F12** را بزنید (یا Right Click → Inspect)
3. تب **Console** را باز کنید
4. این کد را Copy/Paste کنید:

```javascript
(async function testAlchemy() {
  console.log('🔍 Testing Alchemy API...');
  
  try {
    const projectId = 'YOUR_PROJECT_ID'; // جایگزین کنید
    const anonKey = 'YOUR_ANON_KEY';     // جایگزین کنید
    
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/test-api-keys`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`
        }
      }
    );
    
    const data = await response.json();
    
    console.log('📊 Test Results:');
    console.log('================');
    
    // Alchemy
    console.log('\n🔷 Alchemy (Ethereum):');
    console.log('  Configured:', data.alchemy.configured ? '✅' : '❌');
    console.log('  Valid:', data.alchemy.valid ? '✅' : '❌');
    if (data.alchemy.error) {
      console.error('  Error:', data.alchemy.error);
    }
    
    // Helius
    console.log('\n🟣 Helius (Solana):');
    console.log('  Configured:', data.helius.configured ? '✅' : '❌');
    console.log('  Valid:', data.helius.valid ? '✅' : '❌');
    if (data.helius.error) {
      console.error('  Error:', data.helius.error);
    }
    
    console.log('\n================');
    
    if (data.alchemy.configured && data.alchemy.valid) {
      console.log('✅ SUCCESS: Alchemy is working!');
    } else if (data.alchemy.configured && !data.alchemy.valid) {
      console.error('❌ ERROR: Alchemy API key is invalid!');
      console.log('💡 Fix: Check /FIX_ALCHEMY_FARSI.md');
    } else {
      console.warn('⚠️ WARNING: Alchemy API key not configured');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
})();
```

5. **Enter** بزنید

### نتیجه در Console:
```
✅ SUCCESS: Alchemy is working!
```

یا

```
❌ ERROR: Alchemy API key is invalid!
💡 Fix: Check /FIX_ALCHEMY_FARSI.md
```

---

## روش 3️⃣: از طریق Supabase Edge Function Logs

### مراحل:
1. به Supabase Dashboard بروید: https://supabase.com/dashboard
2. پروژه خود را باز کنید
3. از منوی چپ: **Edge Functions**
4. روی `make-server-e5bc10d1` کلیک کنید
5. تب **Logs** را باز کنید
6. فیلتر کنید: `[Alchemy]` یا `[Blockchain Check]`

### لاگ‌های خوب (کار می‌کند):
```
[Blockchain Check] ✅ Updated ETH balance to: 0.0
[Alchemy] ✅ Balance fetched successfully
```

### لاگ‌های بد (کار نمی‌کند):
```
[Alchemy] ❌ Authentication failed: Must be authenticated!
[Blockchain Check] ❌ Alchemy authentication failed
[Blockchain Check] Skipping Ethereum checks for 10 minutes...
```

---

## روش 4️⃣: تست مستقیم با cURL (برای پیشرفته)

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/make-server-e5bc10d1/test-api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### نتیجه موفق:
```json
{
  "helius": {
    "configured": true,
    "valid": true,
    "error": null
  },
  "alchemy": {
    "configured": true,
    "valid": true,
    "error": null
  }
}
```

### نتیجه ناموفق:
```json
{
  "alchemy": {
    "configured": true,
    "valid": false,
    "error": "Must be authenticated!"
  }
}
```

---

## 📊 تفسیر نتایج:

### ✅ حالت 1: همه چیز خوب است
```
Alchemy: configured=true, valid=true, error=null
```
**معنی:** API key شما صحیح است و کار می‌کند! 🎉

---

### ❌ حالت 2: API key نامعتبر
```
Alchemy: configured=true, valid=false, error="Must be authenticated!"
```

**معنی:** API key در Supabase ست شده، اما نادرست است.

**دلایل محتمل:**
1. URL کامل را paste کرده‌اید (باید فقط قسمت بعد از `/v2/` باشد)
2. Ethereum Mainnet در Alchemy فعال نیست
3. API key منقضی شده یا حذف شده

**راه حل:**
- فایل `/FIX_ALCHEMY_FARSI.md` را بخوانید
- یا فایل `/ENABLE_ETH_MAINNET.md` را بخوانید

---

### ⚠️ حالت 3: API key تنظیم نشده
```
Alchemy: configured=false, valid=false, error=null
```

**معنی:** هیچ API key در Supabase ست نشده.

**راه حل:**
1. API key از Alchemy بگیرید
2. در Supabase Secrets تنظیم کنید
3. 5-10 دقیقه صبر کنید

---

### ❌ حالت 4: Network غیرفعال
```
Alchemy: configured=true, valid=false, error="ETH_MAINNET is not enabled"
```

**معنی:** API key درست است، اما Ethereum Mainnet در Alchemy فعال نیست.

**راه حل:**
- فایل `/ENABLE_ETH_MAINNET.md` را بخوانید
- به Alchemy Dashboard → Networks → Enable Ethereum Mainnet

---

## 🔄 بعد از تغییر API Key:

### چقدر باید صبر کرد؟
- **Supabase Secrets:** 5-10 دقیقه (برای restart شدن Edge Function)
- **Enable کردن Network در Alchemy:** فوری (بدون صبر)

### چک کردن که restart شده:
1. Supabase → Edge Functions → `make-server-e5bc10d1`
2. اگر **Last Deployed** تغییر کرده، restart شده ✅
3. اگر تغییر نکرده، باید دستی Redeploy کنید

---

## 🆘 اگر هنوز کار نمی‌کند:

### چک لیست نهایی:
- [ ] API key درست است؟ (فقط حروف و اعداد، حدود 30-40 کاراکتر)
- [ ] URL کامل paste نکرده‌اید؟ (نباید `https://` داشته باشد)
- [ ] Ethereum Mainnet در Alchemy فعال است؟
- [ ] Secret در Supabase با نام دقیق `ALCHEMY_API_KEY` ست شده؟
- [ ] حداقل 10 دقیقه صبر کرده‌اید؟
- [ ] Edge Function restart شده؟

### آخرین راه حل:
1. Secret را در Supabase **DELETE** کنید
2. API key جدید از Alchemy بگیرید
3. Secret جدید بسازید
4. 10 دقیقه صبر کنید
5. دوباره تست کنید

---

## 📞 منابع کمکی:

- **راهنمای کامل فارسی:** `/FIX_ALCHEMY_FARSI.md`
- **فعال‌سازی Mainnet:** `/ENABLE_ETH_MAINNET.md`
- **راهنمای Setup:** `/ALCHEMY_SETUP_FARSI.md`
- **تست HTML:** `/TEST_ALCHEMY.html`

---

**موفق باشید!** 🚀
