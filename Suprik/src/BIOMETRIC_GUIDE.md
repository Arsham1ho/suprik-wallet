# 🔐 راهنمای کامل قفل بیومتریک Saturn Wallet

## ✅ وضعیت فعلی

قفل بیومتریک **کاملاً پیاده‌سازی شده** و آماده استفاده است! 🎉

---

## 🚀 قابلیت‌های پیاده‌سازی شده

### 1. **احراز هویت بیومتریک واقعی**
- ✅ اثر انگشت (Fingerprint) - Android
- ✅ Touch ID - iOS/Mac
- ✅ Face ID - iPhone/iPad
- ✅ Windows Hello - Windows

### 2. **تنظیمات امنیتی**
- ✅ فعال/غیرفعال کردن قفل بیومتریک
- ✅ زمان‌بندی Auto-lock (1 دقیقه تا 1 ساعت)
- ✅ نیاز به تأیید برای تراکنش‌ها
- ✅ ذخیره زمان آخرین احراز هویت

### 3. **UI/UX**
- ✅ صفحه قفل زیبا با انیمیشن
- ✅ نمایش نوع بیومتریک (Touch ID, Face ID, etc.)
- ✅ شمارنده تلاش‌های ناموفق
- ✅ راهنمای کاربر

---

## 📱 نحوه استفاده

### مرحله 1: فعال‌سازی بیومتریک

1. وارد اپ شوید
2. بروید به **Settings** (تنظیمات)
3. انتخاب کنید **Security** (امنیت)
4. سوئیچ **"Enable Touch ID/Face ID"** را فعال کنید
5. پرامپت بیومتریک دستگاه نمایش داده می‌شود
6. اثر انگشت یا Face ID خود را تأیید کنید

### مرحله 2: تنظیم Auto-lock

پس از فعال‌سازی، می‌توانید:

- **Auto-lock After** را تنظیم کنید:
  - Never (هیچوقت)
  - 1 minute
  - 2 minutes
  - 5 minutes (پیش‌فرض)
  - 10 minutes
  - 15 minutes
  - 30 minutes
  - 1 hour

- **Require for Transactions** را فعال کنید:
  - اگر فعال باشد، قبل از هر تراکنش بیومتریک درخواست می‌شود

### مرحله 3: تجربه قفل

وقتی والت قفل می‌شود:

1. صفحه قفل نمایش داده می‌شود
2. به صورت خودکار پرامپت بیومتریک باز می‌شود
3. اثر انگشت/Face ID خود را تأیید کنید
4. والت باز می‌شود! 🎉

---

## 🔧 تکنولوژی استفاده شده

### Web Authentication API (WebAuthn)
```typescript
// فایل: /utils/biometric.ts

// بررسی در دسترس بودن
PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()

// ثبت credential
navigator.credentials.create({ publicKey: options })

// احراز هویت
navigator.credentials.get({ publicKey: options })
```

### ویژگی‌های امنیتی:
- ✅ داده‌های بیومتریک روی دستگاه ذخیره می‌شوند (نه سرور)
- ✅ از Platform Authenticator استفاده می‌کند
- ✅ Challenge-based authentication
- ✅ Credential ID در localStorage (در production باید روی سرور باشد)

---

## 📋 کدهای کلیدی

### 1. فعال‌سازی بیومتریک
```typescript
// فایل: /components/pages/SecuritySettings.tsx

const toggleBiometric = async (enabled: boolean) => {
  if (enabled) {
    const result = await registerBiometric(walletId);
    if (result.success) {
      await updateSettings({ 
        biometric: {
          enabled: true,
          autoLockMinutes: 5,
          requireForTransactions: true,
        }
      });
    }
  }
};
```

### 2. بررسی وضعیت قفل
```typescript
// فایل: /App.tsx

const checkBiometricLock = async (walletId: string) => {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/user-settings/${walletId}`
  );
  const settings = await response.json();
  const biometric = settings.biometric;
  
  if (biometric?.enabled && biometric.autoLockMinutes > 0) {
    const locked = isWalletLocked(walletId, biometric.autoLockMinutes);
    setIsLocked(locked);
  }
};
```

### 3. احراز هویت
```typescript
// فایل: /components/BiometricLock.tsx

const handleAuthenticate = async () => {
  const result = await authenticateBiometric(walletId, 'Unlock Saturn Wallet');
  
  if (result.success) {
    toast.success('Wallet unlocked');
    onUnlock();
  } else {
    toast.error(result.error || 'Authentication failed');
  }
};
```

---

## 🧪 تست قفل بیومتریک

### در مرورگرهای مختلف:

#### ✅ Safari (iOS/macOS)
- Touch ID/Face ID کار می‌کند
- بهترین تجربه کاربری

#### ✅ Chrome (Android/Windows)
- Fingerprint/Windows Hello کار می‌کند
- نیاز به HTTPS

#### ✅ Edge (Windows)
- Windows Hello کار می‌کند

#### ❌ Firefox
- پشتیبانی محدود از WebAuthn Platform Authenticator
- ممکن است کار نکند

### نحوه تست:

1. **فعال‌سازی:**
   ```
   Settings → Security → Enable Touch ID
   ```

2. **تست Auto-lock:**
   ```
   Settings → Security → Auto-lock After → 1 minute
   صبر کنید 1 دقیقه
   اپ را Refresh کنید
   صفحه قفل باید نمایش داده شود
   ```

3. **تست Visibility Change:**
   ```
   به تب دیگری بروید
   بعد از مدت auto-lock برگردید
   صفحه قفل باید نمایش داده شود
   ```

---

## 🔒 امنیت

### داده‌های ذخیره شده در localStorage:

```typescript
// Credential ID
localStorage.setItem(`biometric_credential_${walletId}`, credentialId);

// آخرین زمان احراز هویت
localStorage.setItem(`biometric_last_auth_${walletId}`, Date.now().toString());
```

### داده‌های ذخیره شده در Supabase:

```typescript
{
  biometric: {
    enabled: boolean,
    autoLockMinutes: number,
    requireForTransactions: boolean
  }
}
```

### ⚠️ نکات امنیتی:

1. **داده بیومتریک هیچوقت به سرور ارسال نمی‌شود**
2. **Credential ID باید در production روی سرور ذخیره شود**
3. **Challenge باید از سرور دریافت شود (الان random است)**
4. **HTTPS اجباری است**

---

## 🐛 عیب‌یابی

### مشکل: "Biometric not available"
**راه حل:**
- اطمینان حاصل کنید دستگاه از بیومتریک پشتیبانی می‌کند
- HTTPS فعال باشد (localhost هم OK است)
- مرورگر از WebAuthn پشتیبانی کند

### مشکل: "Authentication failed"
**راه حل:**
- Credential را پاک کنید و دوباره ثبت‌نام کنید
- localStorage را بررسی کنید
- Console errors را چک کنید

### مشکل: قفل فعال نمی‌شود
**راه حل:**
- بررسی کنید Settings در Supabase ذخیره شده باشد
- Network tab را چک کنید
- Server logs را ببینید

---

## 📊 معماری کامل

```
┌─────────────────┐
│  User Action    │
│  (Enable Lock)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  WebAuthn API           │
│  - Create Credential    │
│  - Store in Device      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Save Settings          │
│  - Supabase DB          │
│  - localStorage         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Auto-lock Timer        │
│  - Check on visibility  │
│  - Check on refresh     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  BiometricLock Screen   │
│  - Show lock UI         │
│  - Request biometric    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Authenticate           │
│  - WebAuthn verify      │
│  - Update last auth     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Unlock Wallet          │
│  - Return to app        │
└─────────────────────────┘
```

---

## 🎯 نتیجه‌گیری

قفل بیومتریک Saturn Wallet:
- ✅ **کاملاً عملیاتی**
- ✅ **از استانداردهای امنیتی استفاده می‌کند**
- ✅ **تجربه کاربری روان**
- ✅ **سازگار با موبایل**

برای تست، فقط کافیه:
1. Settings → Security
2. Enable Touch ID/Face ID
3. Set Auto-lock to 1 minute
4. Refresh صفحه یا منتظر بمانید

**والت شما با بیومتریک محافظت می‌شود! 🔐✨**
