# 🔑 Environment Variables برای Vercel

این فایل را هنگام Deploy به Vercel استفاده کنید.

---

## ⚡ کپی و پیست سریع

**برای Vercel، این متغیرها را یک به یک اضافه کنید:**

---

### ✅ متغیر 1: VITE_SUPABASE_URL

```
Key (Name):
VITE_SUPABASE_URL

Value:
https://qagsgxsaxspomcysaesa.supabase.co

Environment:
☑ Production  ☑ Preview  ☑ Development
```

➡️ دکمه **Add** بزنید

---

### ✅ متغیر 2: VITE_SUPABASE_ANON_KEY

```
Key (Name):
VITE_SUPABASE_ANON_KEY

Value:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ3NneHNheHNwb21jeXNhZXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTEzMTIsImV4cCI6MjA3NzYyNzMxMn0.nXIq2kt816zG1yTPfG-FPDPubnPZ2n5tpQ7MFAB6sVM

Environment:
☑ Production  ☑ Preview  ☑ Development
```

➡️ دکمه **Add** بزنید

---

### ⚠️ متغیر 3: SUPABASE_SERVICE_ROLE_KEY

**این را از Supabase Dashboard خود بگیرید:**

1. به https://supabase.com/dashboard/project/qagsgxsaxspomcysaesa بروید
2. **Settings** → **API** کلیک کنید
3. بخش **Project API keys** را پیدا کنید
4. کلید **service_role** را کپی کنید (روی آیکون کپی کلیک کنید)

```
Key (Name):
SUPABASE_SERVICE_ROLE_KEY

Value:
[کلید service_role را از Supabase کپی کنید - شبیه eyJhbGc...]

Environment:
☑ Production  ☑ Preview  ☑ Development
```

**🔴 مهم:** این کلید SECRET است! هرگز public نکنید!

➡️ دکمه **Add** بزنید

---

### ⚠️ متغیر 4: SUPABASE_DB_URL

**این را از Supabase Dashboard خود بگیرید:**

1. به https://supabase.com/dashboard/project/qagsgxsaxspomcysaesa بروید
2. **Settings** → **Database** کلیک کنید
3. بخش **Connection string** را پیدا کنید
4. **URI** را انتخاب کنید
5. رشته کامل را کپی کنید

```
Key (Name):
SUPABASE_DB_URL

Value:
postgresql://postgres:[YOUR-PASSWORD]@db.qagsgxsaxspomcysaesa.supabase.co:5432/postgres

Environment:
☑ Production  ☑ Preview  ☑ Development
```

**نکته:** `[YOUR-PASSWORD]` را با پسورد واقعی database خود جایگزین کنید!

➡️ دکمه **Add** بزنید

---

## 🔵 متغیرهای اختیاری (می‌توانید بعداً اضافه کنید)

این متغیرها برای قابلیت‌های پیشرفته هستند:

---

### متغیر 5: VITE_HELIUS_API_KEY (برای Solana)

**چطور بگیریم:**
1. به https://www.helius.dev بروید
2. ثبت‌نام کنید (رایگان)
3. یک API key بسازید
4. کپی کنید

```
Key (Name):
VITE_HELIUS_API_KEY

Value:
[کلید Helius خود]

Environment:
☑ Production  ☑ Preview  ☑ Development
```

---

### متغیر 6: VITE_ALCHEMY_API_KEY (برای Ethereum)

**چطور بگیریم:**
1. به https://www.alchemy.com بروید
2. ثبت‌نام کنید (رایگان)
3. یک App بسازید
4. API key را کپی کنید

```
Key (Name):
VITE_ALCHEMY_API_KEY

Value:
[کلید Alchemy خود]

Environment:
☑ Production  ☑ Preview  ☑ Development
```

---

### متغیر 7: APP_FEE_WALLET (آدرس کیف پول)

```
Key (Name):
APP_FEE_WALLET

Value:
[آدرس Solana wallet خود برای دریافت کارمزد]

Environment:
☑ Production  ☑ Preview  ☑ Development
```

مثال: `5xot9PAvkxj6YJVeLcHLTfVMNw5EL3zKM6gRV8bGpUqm`

---

### متغیر 8: RESEND_API_KEY (برای ایمیل)

**چطور بگیریم:**
1. به https://resend.com بروید
2. ثبت‌نام کنید
3. API key بسازید

```
Key (Name):
RESEND_API_KEY

Value:
[کلید Resend خود]

Environment:
☑ Production  ☑ Preview  ☑ Development
```

---

## 📋 خلاصه: چه چیزی نیاز دارید؟

### ✅ اجباری (باید حتماً اضافه کنید):

1. ✅ `VITE_SUPABASE_URL` - آماده است! (کپی کنید)
2. ✅ `VITE_SUPABASE_ANON_KEY` - آماده است! (کپی کنید)
3. ⚠️ `SUPABASE_SERVICE_ROLE_KEY` - از Supabase بگیرید
4. ⚠️ `SUPABASE_DB_URL` - از Supabase بگیرید

### 🔵 اختیاری (بعداً):

5. 🔵 `VITE_HELIUS_API_KEY` - برای Solana (اختیاری)
6. 🔵 `VITE_ALCHEMY_API_KEY` - برای Ethereum (اختیاری)
7. 🔵 `APP_FEE_WALLET` - برای کارمزد (اختیاری)
8. 🔵 `RESEND_API_KEY` - برای ایمیل (اختیاری)

---

## 🎯 راهنمای گرفتن کلیدهای Supabase

### مرحله 1: بگیریم SUPABASE_SERVICE_ROLE_KEY

```
1. به Supabase Dashboard بروید:
   https://supabase.com/dashboard/project/qagsgxsaxspomcysaesa

2. در منوی چپ:
   Settings → API

3. پیدا کنید:
   "Project API keys"

4. کپی کنید:
   service_role (secret) key
   
   شبیه این است:
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```

### مرحله 2: بگیریم SUPABASE_DB_URL

```
1. همان Dashboard:
   Settings → Database

2. پیدا کنید:
   "Connection string"

3. انتخاب کنید:
   "URI" (نه Golang یا غیره!)

4. کپی کنید:
   postgresql://postgres:[YOUR-PASSWORD]@db...
   
5. جایگزین کنید:
   [YOUR-PASSWORD] با پسورد database خود
```

**نکته:** اگر پسورد را فراموش کرده‌اید:
- Settings → Database → Reset database password

---

## 🖼️ تصویر ذهنی در Vercel

وقتی Environment Variables اضافه می‌کنید:

```
┌─────────────────────────────────────────────────┐
│ Environment Variables                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ Key                                             │
│ ┌─────────────────────────────────────────┐   │
│ │ VITE_SUPABASE_URL                       │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Value                                           │
│ ┌─────────────────────────────────────────┐   │
│ │ https://qagsgxsaxspomcysaesa.supabase...│   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Environments                                    │
│ ☑ Production  ☑ Preview  ☑ Development         │
│                                                 │
│                           [Add]                 │
└─────────────────────────────────────────────────┘
```

دکمه **Add** را بزنید، بعد متغیر بعدی!

---

## ✅ چک‌لیست نهایی:

قبل از Deploy، مطمئن شوید:

- [ ] `VITE_SUPABASE_URL` اضافه شد ✅
- [ ] `VITE_SUPABASE_ANON_KEY` اضافه شد ✅
- [ ] `SUPABASE_SERVICE_ROLE_KEY` از Supabase گرفتم ⚠️
- [ ] `SUPABASE_DB_URL` از Supabase گرفتم ⚠️
- [ ] همه متغیرها برای Production, Preview, Development تیک دارند ✅
- [ ] دکمه Add را برای هر کدام زدم ✅

**حالا آماده Deploy هستید!** 🚀

---

## 🆘 کمک سریع

### خطا: "Cannot find SUPABASE_SERVICE_ROLE_KEY"

```
✅ راه حل:
1. به Vercel Dashboard بروید
2. Your Project → Settings → Environment Variables
3. چک کنید SUPABASE_SERVICE_ROLE_KEY وجود دارد
4. اگر نه، اضافه کنید
5. Deployments → ... → Redeploy
```

### خطا: "Database connection failed"

```
✅ راه حل:
1. چک کنید SUPABASE_DB_URL درست است
2. مطمئن شوید پسورد صحیح است
3. فرمت: postgresql://postgres:PASSWORD@db...
```

### نمی‌دانم پسورد Database چیست

```
✅ راه حل:
1. Supabase Dashboard → Settings → Database
2. "Reset database password"
3. پسورد جدید بسازید
4. SUPABASE_DB_URL را با پسورد جدید بروز کنید
5. در Vercel → Settings → Environment Variables
6. SUPABASE_DB_URL را Edit کنید
7. Redeploy
```

---

## 🔗 لینک‌های مفید:

| چیز | لینک |
|-----|------|
| 🟢 **Supabase Dashboard** | https://supabase.com/dashboard/project/qagsgxsaxspomcysaesa |
| 🟣 **Vercel Dashboard** | https://vercel.com/dashboard |
| 📘 **Supabase API Keys** | Dashboard → Settings → API |
| 🗄️ **Database Settings** | Dashboard → Settings → Database |

---

## 💡 نکات امنیتی:

### ✅ انجام دهید:
- ✅ `SUPABASE_SERVICE_ROLE_KEY` را SECRET نگه دارید
- ✅ `SUPABASE_DB_URL` را در GitHub commit نکنید
- ✅ تنها در Vercel Environment Variables اضافه کنید

### ❌ انجام ندهید:
- ❌ Service Role Key را در کد frontend استفاده نکنید
- ❌ Database password را public نکنید
- ❌ Environment variables را در Git push نکنید

---

**همه چیز آماده است! 🎉**

این متغیرها را در Vercel اضافه کنید و Deploy کنید!

---

## 📞 اگر سوال داشتید:

به من بگویید کدام مرحله گیر کردید:
- 🔍 "چطور service_role key پیدا کنم؟"
- 🔑 "DB_URL ساختار چطوریه؟"
- 🚀 "همه چیز آماده است، Deploy کنم؟"

من کمک می‌کنم! 💪
