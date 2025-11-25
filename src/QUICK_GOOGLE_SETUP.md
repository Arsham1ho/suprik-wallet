# ⚡ راهنمای سریع: فعال‌سازی Google Sign-In

شما Google OAuth Client را ایجاد کردید! ✅  
حالا فقط **2 مرحله** باقی مانده:

---

## 📋 اطلاعات شما (از تصویر):

```
Client ID: 373210276344-c23pf930m8r85dao892q0djp2q5l9ja2.apps.googleusercontent.com
Client Secret: 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
```

**⚠️ این اطلاعات را محرمانه نگه دارید!**

---

## مرحله 1️⃣: تنظیم Redirect URI در Google Cloud

1. **برو به:** https://console.cloud.google.com/
2. **APIs & Services** → **Credentials**
3. **کلیک روی OAuth Client که ساختید**
4. **Authorized redirect URIs** → کلیک روی **"ADD URI"**
5. **کپی و پیست کنید:**
   ```
   https://qagsgxsaxspomcysaesa.supabase.co/auth/v1/callback
   ```
6. **SAVE** کلیک کنید

---

## مرحله 2️⃣: تنظیم در Supabase Dashboard

1. **برو به:** https://supabase.com/dashboard
2. **پروژه خود را انتخاب کن** (qagsgxsaxspomcysaesa)
3. منوی چپ → **Authentication** → **Providers**
4. **پیدا کردن "Google"** و کلیک روی آن
5. **Enable** کردن toggle (روشن کردن)
6. **وارد کردن اطلاعات:**
   - **Client ID (OAuth client ID):**
     ```
     373210276344-c23pf930m8r85dao892q0djp2q5l9ja2.apps.googleusercontent.com
     ```
   - **Client Secret:**
     ```
     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
     ```
7. **SAVE** کلیک کنید

---

## مرحله 3️⃣: تنظیم OAuth Consent Screen (مهم!)

اگر هنوز OAuth Consent Screen را تنظیم نکرده‌اید:

1. **Google Cloud Console** → **APIs & Services** → **OAuth consent screen**
2. **User Type:** External (برای تست) یا Internal (اگر Google Workspace دارید)
3. **App information:**
   - App name: `Saturn Wallet`
   - User support email: ایمیل خودتان
   - Developer contact: ایمیل خودتان
4. **Scopes:** فقط scopes پیش‌فرض کافیست (email, profile)
5. **Test users:** اضافه کردن ایمیل خودتان
6. **SAVE**

---

## ✅ تست کردن

1. **بازگشت به اپلیکیشن Saturn Wallet**
2. **Refresh کردن صفحه** (F5)
3. **کلیک روی "Continue with Google"**
4. **باید به صفحه Google هدایت شوید**
5. **انتخاب اکانت Google**
6. **بعد از موفقیت، بازگشت به Saturn با wallet جدید! 🎉**

---

## 🐛 اگر کار نکرد:

### خطا: "redirect_uri_mismatch"
- مطمئن شوید Redirect URI در Google دقیقاً این است:
  ```
  https://qagsgxsaxspomcysaesa.supabase.co/auth/v1/callback
  ```
- بدون اسلش اضافی در آخر!

### خطا: "Access blocked"
- OAuth Consent Screen را تنظیم کنید
- ایمیل خود را به Test Users اضافه کنید

### خطا: "provider is not enabled"
- مطمئن شوید در Supabase Dashboard، Google را **Enable** کرده‌اید
- Client ID و Secret را ذخیره کرده‌اید

### چیزی نمی‌بینم / صفحه سفید
- باز کردن Console مرورگر (F12)
- چک کردن خطاها
- لاگ‌ها را مطالعه کنید

---

## 💡 نکات مهم

- **زمان انتشار تغییرات:** 5-10 دقیقه
- **Cache مرورگر:** اگر مشکل داشتید، Incognito/Private mode تست کنید
- **Test Users:** فقط کاربران در لیست Test Users می‌توانند وارد شوند (حالت Testing)
- **Production:** برای استفاده عمومی، باید OAuth را Verify کنید (چند روز زمان می‌برد)

---

**همین! 🚀 بعد از این مراحل، Google Sign-In کامل کار می‌کند!**
