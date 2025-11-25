# 🔍 راهنمای Debug کردن Google OAuth

اگر Google Sign-In کار نمی‌کند، این مراحل را دنبال کنید:

---

## 🧪 مرحله 1: بررسی Console مرورگر

1. **باز کردن Developer Tools:**
   - Windows/Linux: `F12` یا `Ctrl + Shift + I`
   - Mac: `Cmd + Option + I`

2. **رفتن به Tab Console**

3. **کلیک روی "Continue with Google"**

4. **مشاهده لاگ‌ها:**
   ```
   [Supabase] Redirecting to google OAuth...
   [Supabase] OAuth URL: https://...
   ```

5. **چک کردن خطاها:**
   - اگر خطای `provider is not enabled` دیدید → **OAuth تنظیم نشده**
   - اگر خطای `redirect_uri_mismatch` دیدید → **Redirect URL اشتباه**
   - اگر redirect شد اما error برگشت → **Credentials اشتباه**

---

## ✅ مرحله 2: تایید تنظیمات Supabase

### بررسی در Supabase Dashboard:

1. برو به: https://supabase.com/dashboard
2. پروژه خود را انتخاب کن
3. منوی چپ → **Authentication** → **Providers**
4. پیدا کردن **Google** در لیست
5. چک کردن:
   - ✅ **Enabled** باید ON باشد
   - ✅ **Client ID** پر شده باشد
   - ✅ **Client Secret** پر شده باشد

### اگر تنظیم نشده:

**شما باید Google OAuth را تنظیم کنید:**
- فایل `/OAUTH_SETUP_GUIDE.md` را باز کنید
- مراحل را دقیق دنبال کنید
- زمان: حدود 10-15 دقیقه

---

## 🔧 مرحله 3: تست Redirect URL

### Redirect URL باید دقیقاً این باشد:

```
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
```

### پیدا کردن Project ID:

1. در Supabase Dashboard
2. بالای صفحه → Project Settings → General
3. کپی کردن **Reference ID**

### تنظیم در Google Cloud Console:

1. برو به: https://console.cloud.google.com/
2. APIs & Services → Credentials
3. کلیک روی OAuth 2.0 Client ID خود
4. Authorized redirect URIs → Add URI
5. پیست کردن URL بالا (با Project ID واقعی)
6. **Save**

---

## 🧪 مرحله 4: تست با ایمیل تست

### قبل از OAuth، بهتر است Email Sign-In را تست کنید:

1. کلیک روی Email Input
2. وارد کردن ایمیل
3. دریافت کد تایید (Demo Mode)
4. وارد کردن پسورد
5. اگر این کار کرد، Backend شما سالم است ✅

---

## 🐛 خطاهای رایج و راه‌حل:

### 1. "Provider is not enabled"
**علت:** Google OAuth در Supabase تنظیم نشده
**راه‌حل:** دنبال کردن `/OAUTH_SETUP_GUIDE.md`

### 2. "redirect_uri_mismatch"
**علت:** Redirect URL در Google Cloud با Supabase مطابقت ندارد
**راه‌حل:** 
- چک کردن URL در Google Cloud Console
- چک کردن URL در Supabase Dashboard
- مطمئن شوید هر دو دقیقاً یکسان هستند

### 3. "invalid_client"
**علت:** Client ID یا Secret اشتباه است
**راه‌حل:**
- دوباره کپی کردن Client ID و Secret از Google Cloud
- پیست کردن در Supabase Dashboard
- ذخیره کردن

### 4. صفحه سفید بعد از redirect
**علت:** OAuth callback handler کار نمی‌کند
**راه‌حل:**
- Refresh کردن صفحه
- چک کردن Console برای خطاها
- Clear کردن localStorage

### 5. "Access blocked: This app's request is invalid"
**علت:** OAuth Consent Screen تنظیم نشده در Google Cloud
**راه‌حل:**
- Google Cloud Console → APIs & Services → OAuth consent screen
- پر کردن اطلاعات اجباری
- Add Test Users (ایمیل خودتان)
- Save

---

## 💡 نکته مهم: Testing vs Production

### حالت Testing (فعلی):
- فقط Test Users می‌توانند وارد شوند
- باید ایمیل‌ها را در Google Cloud Console اضافه کنید
- محدودیت 100 کاربر

### حالت Production:
- همه می‌توانند وارد شوند
- نیاز به Verification از Google (چند روز طول می‌کشد)
- Privacy Policy و Terms of Service اجباری

---

## 🎯 مراحل برای تست سریع:

### اگر می‌خواهید سریع تست کنید:

1. ✅ Google OAuth را Setup کنید (15 دقیقه)
2. ✅ ایمیل خود را به Test Users اضافه کنید
3. ✅ با ایمیل خود تست کنید
4. ✅ باید کار کند! 🎉

### اگر نمی‌خواهید OAuth setup کنید:

1. ✅ از Email Sign-In استفاده کنید
2. ✅ Demo Mode فعال است (کد در صفحه نمایش داده می‌شود)
3. ✅ 100% کار می‌کند بدون نیاز به تنظیمات اضافی

---

## 📞 در صورت نیاز به کمک:

1. Screenshot از خطا در Console
2. Screenshot از تنظیمات Supabase (بدون نمایش Secret!)
3. توضیح دقیق مراحلی که انجام دادید

---

**موفق باشید! 🚀**
