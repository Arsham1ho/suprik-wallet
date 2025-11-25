# 🔐 Biometric Authentication Guide

## نمای کلی
سیستم احراز هویت بیومتریک به کیف پول Saturn اضافه شد که از Touch ID، Face ID، Windows Hello و سایر authenticator های پلتفرم پشتیبانی می‌کند.

## ویژگی‌های کلیدی

### 1. قفل خودکار کیف پول (Auto-Lock)
- کیف پول به طور خودکار پس از مدت زمان مشخص قفل می‌شود
- گزینه‌های زمانی: Never, 1, 2, 5, 10, 15, 30 دقیقه، 1 ساعت
- وقتی اپ را باز می‌کنید، باید با biometric باز شود

### 2. تایید تراکنش‌ها
- قبل از ارسال توکن یا swap، نیاز به تایید biometric
- افزایش امنیت برای تراکنش‌های مالی
- می‌توان فعال یا غیرفعال کرد

### 3. پشتیبانی از همه پلتفرم‌ها
- **iOS/iPadOS**: Face ID یا Touch ID
- **macOS**: Touch ID
- **Windows**: Windows Hello (fingerprint, face, PIN)
- **Android**: Fingerprint یا Face Unlock

## نحوه استفاده

### فعال‌سازی Biometric Auth

1. به **Settings** بروید
2. **Security & Privacy** را انتخاب کنید
3. قسمت **Biometric Authentication** را پیدا کنید
4. سوئیچ **Enable Touch ID/Face ID** را فعال کنید
5. اولین بار که فعال می‌کنید، از شما درخواست احراز هویت می‌شود

### تنظیمات

#### Auto-Lock Timer
```
Settings → Security & Privacy → Biometric Authentication → Auto-lock After
```
- انتخاب کنید چند دقیقه بعد از آخرین استفاده کیف پول قفل شود
- پیشنهاد: 5 دقیقه برای تعادل بین امنیت و راحتی

#### Require for Transactions
```
Settings → Security & Privacy → Biometric Authentication → Require for Transactions
```
- وقتی فعال است، هر تراکنش نیاز به تایید biometric دارد
- پیشنهاد: فعال برای امنیت بیشتر

## جزئیات فنی

### Web Authentication API (WebAuthn)
- استفاده از استاندارد W3C WebAuthn
- احراز هویت بدون رمز عبور
- داده‌های biometric هرگز از دستگاه خارج نمی‌شوند

### ذخیره‌سازی ایمن
- Credential ID در localStorage ذخیره می‌شود
- Private key در Secure Enclave (iOS/Mac) یا TPM (Windows) ذخیره می‌شود
- سرور هیچ داده‌ی biometric دریافت نمی‌کند

### فلوی امنیتی
```
1. کاربر اپ را باز می‌کند
2. بررسی می‌شود آیا auto-lock فعال است
3. اگر زمان گذشته > auto-lock timer → نمایش BiometricLock
4. کاربر biometric authentication را تکمیل می‌کند
5. اپ باز می‌شود
```

## مثال‌های کد

### بررسی دسترس‌پذیری Biometric
```typescript
import { isBiometricAvailable } from '../utils/biometric';

const available = await isBiometricAvailable();
if (available) {
  console.log('Biometric is supported!');
}
```

### ثبت Credential جدید
```typescript
import { registerBiometric } from '../utils/biometric';

const result = await registerBiometric(walletId);
if (result.success) {
  console.log('Biometric registered successfully');
} else {
  console.error('Error:', result.error);
}
```

### احراز هویت
```typescript
import { authenticateBiometric } from '../utils/biometric';

const result = await authenticateBiometric(walletId, 'Unlock wallet');
if (result.success) {
  // User authenticated
  unlockWallet();
}
```

### بررسی وضعیت قفل
```typescript
import { isWalletLocked } from '../utils/biometric';

const locked = isWalletLocked(walletId, autoLockMinutes);
if (locked) {
  showBiometricLock();
}
```

## کامپوننت‌ها

### BiometricLock.tsx
- صفحه قفل کیف پول
- انیمیشن اثر انگشت
- دکمه unlock
- شمارنده تلاش‌های ناموفق

### BiometricConfirmDialog.tsx
- دیالوگ تایید تراکنش
- نمایش جزئیات تراکنش (مقدار، آدرس)
- دکمه authenticate
- مدیریت خطاها

### SecuritySettings.tsx
- تنظیمات biometric
- فعال/غیرفعال کردن
- تنظیم auto-lock timer
- تنظیم require for transactions

## تست

### تست در مرورگرهای مختلف

#### Chrome/Edge (Desktop)
- باید Windows Hello را تنظیم کرده باشید
- یا PIN، یا fingerprint، یا face recognition

#### Safari (macOS)
- Touch ID روی MacBook Pro با Touch Bar
- یا استفاده از Apple Watch برای unlock

#### Safari (iOS)
- Face ID روی iPhone X و بالاتر
- Touch ID روی مدل‌های قدیمی‌تر

#### Chrome (Android)
- Fingerprint یا Face Unlock
- باید در تنظیمات Android فعال باشد

### مرورگرهایی که پشتیبانی نمی‌کنند
اگر WebAuthn پشتیبانی نشود:
- گزینه biometric در Settings نمایش داده نمی‌شود
- از password protection استفاده کنید

## نکات امنیتی

### ✅ بهترین روش‌ها
1. همیشه auto-lock را فعال کنید
2. از timeout کوتاه‌تر برای حساسیت بیشتر استفاده کنید
3. Require for transactions را فعال نگه دارید
4. مرورگر خود را به‌روز نگه دارید

### ⚠️ محدودیت‌ها
1. نیاز به hardware biometric (fingerprint reader, camera)
2. نیاز به تنظیم biometric در سیستم عامل
3. بعضی مرورگرها WebAuthn را پشتیبانی نمی‌کنند
4. Private browsing ممکن است کار نکند

### 🔒 حریم خصوصی
- داده‌های biometric هرگز به سرور ارسال نمی‌شوند
- فقط challenge-response رد و بدل می‌شود
- Private keys در secure hardware ذخیره می‌شوند
- هر wallet credential مجزا دارد

## عیب‌یابی

### "Biometric not available"
- مطمئن شوید دستگاه شما biometric دارد
- بررسی کنید در تنظیمات OS فعال است
- مرورگر را restart کنید

### "Authentication failed"
- دوباره امتحان کنید
- اثر انگشت یا صورت خود را تمیز کنید
- از backup authentication استفاده کنید (PIN)

### "NotAllowedError"
- کاربر authentication را لغو کرد
- Permission داده نشده
- تایم‌اوت شده (60 ثانیه)

### کیف پول بدون دلیل قفل می‌شود
- بررسی کنید auto-lock timer چقدر است
- بررسی کنید آیا tab را عوض می‌کنید
- در console `localStorage` را بررسی کنید:
  ```javascript
  localStorage.getItem('biometric_last_auth_<walletId>')
  ```

## مقایسه با Password Protection

| ویژگی | Biometric | Password |
|-------|-----------|----------|
| سرعت | ⚡ سریع | 🐌 کند |
| امنیت | 🔐 عالی | 🔐 خوب |
| راحتی | 😊 آسان | 😐 متوسط |
| پشتیبانی دستگاه | 📱 محدود | 🌐 همه |
| قابل بازیابی | ❌ خیر | ✅ بله |

### پیشنهاد
**هر دو را فعال کنید!**
- Biometric برای استفاده روزمره
- Password به عنوان fallback

## مثال کامل: ایجاد صفحه محافظت‌شده

```typescript
import { useState, useEffect } from 'react';
import { BiometricLock } from './components/BiometricLock';
import { isWalletLocked } from './utils/biometric';

function ProtectedApp({ walletId }) {
  const [isLocked, setIsLocked] = useState(true);
  const [biometricSettings, setBiometricSettings] = useState(null);

  useEffect(() => {
    loadSettings();
  }, [walletId]);

  const loadSettings = async () => {
    // Load user's biometric settings from database
    const settings = await fetchUserSettings(walletId);
    setBiometricSettings(settings.biometric);

    if (settings.biometric?.enabled) {
      const locked = isWalletLocked(
        walletId, 
        settings.biometric.autoLockMinutes
      );
      setIsLocked(locked);
    } else {
      setIsLocked(false);
    }
  };

  if (isLocked) {
    return <BiometricLock walletId={walletId} onUnlock={() => setIsLocked(false)} />;
  }

  return <YourMainApp />;
}
```

## منابع

- [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [WebAuthn Guide](https://webauthn.guide/)
- [FIDO Alliance](https://fidoalliance.org/)

---

**تاریخ به‌روزرسانی**: 2025-01-04
**نسخه**: 1.0.0
