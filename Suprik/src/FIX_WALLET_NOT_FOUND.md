# 🔧 رفع خطای "wallet not found"

## ❌ مشکل شما

شما در صفحه **Import Wallet** هستید و "adm" را 12 بار وارد کرده‌اید:

```
Import Wallet
[adm] [adm] [adm] [adm]
[adm] [adm] [adm] [adm]
[adm] [adm] [adm] [adm]

→ Click "Import Wallet"
→ ❌ "wallet not found"
```

## 🤔 چرا کار نمی‌کند؟

**چون "adm" یک Recovery Phrase نیست!**

```
❌ "adm" × 12 = Not a valid recovery phrase
✅ "adm" × 12 = Admin panel password (در جای دیگر!)
```

---

## ✅ راه‌حل (2 دقیقه)

### گام 1: خروج از Import Wallet
```
[←] Back button را بزنید
```

### گام 2: ساخت Wallet واقعی
```
گزینه A (سریع ⚡):
  → "Sign In with Google"
  → انتخاب Google account
  → ✅ وارد شدید (10 ثانیه)

گزینه B:
  → "Create New Wallet"
  → "Generate Recovery Phrase"
  → ذخیره 12 کلمه واقعی
  → ✅ وارد شدید
```

### گام 3: رفتن به Settings
```
Home → پایین صفحه → ⚙️ Settings
```

### گام 4: باز کردن Admin Panel
```
Settings → Scroll down → Developer section
→ کلیک "Admin Panel"
```

### گام 5: تایپ "adm" (اینجا!)
```
Dialog باز می‌شود
→ تایپ "adm" در input box
→ 12 بار تکرار
→ ✅ وارد Admin Panel!
```

---

## 🎯 خلاصه

```
┌──────────────────────────────────────┐
│  Import Wallet با "adm"              │
│  ❌ اشتباه است!                      │
└──────────────────────────────────────┘
                ↓
┌──────────────────────────────────────┐
│  1. Back                             │
│  2. Sign In with Google ⚡           │
│  3. Settings → Developer             │
│  4. Admin Panel dialog               │
│  5. تایپ "adm" × 12                  │
│  ✅ موفق!                            │
└──────────────────────────────────────┘
```

---

## 💡 به خاطر بسپارید

```
Recovery Phrase:
  📍 برای: ساخت/بازیابی wallet
  📝 فرمت: 12 کلمه مختلف
  🎯 کجا: Import Wallet صفحه

Admin Password:
  📍 برای: ورود به Admin Panel
  📝 فرمت: "adm" × 12
  🎯 کجا: Admin Login Dialog
```

---

## 🚀 شروع کنید!

**پیشنهاد:** از Google استفاده کنید (خیلی سریع‌تر!)

```
1. [←] Back
2. "Sign In with Google"
3. ✅ 30 ثانیه → Admin Panel!
```

---

**📖 راهنمای کامل:**
- `CORRECT_ADMIN_LOGIN_STEPS.md` - مراحل دقیق
- `ADMIN_VISUAL_GUIDE.md` - راهنمای تصویری
- `TEST_ADMIN_NOW.md` - تست سریع

**✅ الان شروع کنید!**
