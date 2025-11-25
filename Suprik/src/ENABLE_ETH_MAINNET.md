# 🔧 فعال‌سازی Ethereum Mainnet در Alchemy

## 🚨 خطای شما:
```
ETH_MAINNET is not enabled for this app
```

## ✅ راه حل (2 دقیقه):

---

## گام 1️⃣: رفتن به صفحه Networks

### روش 1: استفاده از لینک مستقیم (سریع‌ترین)
کپی کنید و در مرورگر باز کنید:
```
https://dashboard.alchemy.com/apps/5z3uwnb35i3r9bh9/networks
```

### روش 2: دستی
1. به https://dashboard.alchemy.com بروید
2. روی App خود (`Saturn Wallet` یا هر اسمی که گذاشتید) کلیک کنید
3. از منوی بالا روی **"Networks"** کلیک کنید

---

## گام 2️⃣: فعال کردن Ethereum Mainnet

در صفحه Networks، لیستی از network‌ها می‌بینید:

```
┌─────────────────────────────────────────────┐
│ Networks                                    │
├─────────────────────────────────────────────┤
│                                             │
│ Ethereum                                    │
│   ○ Mainnet                 [Enable]        │ ← این را فعال کنید
│   ● Sepolia                 [Enabled]       │
│   ○ Holesky                 [Enable]        │
│                                             │
│ Polygon                                     │
│   ○ Mainnet                 [Enable]        │
│   ● Amoy                    [Enabled]       │
│                                             │
└─────────────────────────────────────────────┘
```

**کار شما:**
1. پیدا کنید: **Ethereum** → **Mainnet**
2. روی دکمه **"Enable"** کلیک کنید
3. یک پیام تایید می‌بینید: "Ethereum Mainnet enabled" ✅

---

## گام 3️⃣: (اختیاری) غیرفعال کردن Testnet‌ها

برای جلوگیری از اشتباه، می‌توانید testnet‌ها را غیرفعال کنید:

- اگر **Sepolia** فعال است، Disable کنید
- اگر **Holesky** فعال است، Disable کنید
- اگر **Goerli** فعال است، Disable کنید

**فقط Ethereum Mainnet باید فعال باشد!**

---

## گام 4️⃣: تست کنید

بعد از فعال کردن Mainnet:

1. **صبر نکنید!** این تغییر فوری است ⚡
2. به اپلیکیشن Saturn بروید
3. **Settings** → **Dev Mode** فعال
4. روی **"تست API Keys"** کلیک کنید
5. باید ببینید: **"Alchemy: معتبر ✅"**

---

## ❓ سوالات متداول

### سوال: چرا Sepolia یا Goerli فعال بود؟
**جواب:** وقتی App می‌سازید، Alchemy به طور پیش‌فرض testnet‌ها را فعال می‌کند. شما باید دستی Mainnet را فعال کنید.

### سوال: آیا Mainnet هزینه دارد؟
**جواب:** نه! Mainnet هم مانند testnet رایگان است (تا 300M واحد در ماه).

### سوال: می‌توانم همزمان Mainnet و Testnet داشته باشم؟
**جواب:** بله، اما برای Saturn فقط Mainnet لازم است.

---

## 🎯 چک لیست

بعد از فعال کردن، مطمئن شوید:

- [x] Ethereum **Mainnet** فعال است (Enabled)
- [x] هیچ testnet دیگری فعال نیست (Sepolia, Goerli, Holesky)
- [x] App شما Active است (نه Suspended)

---

## 🔍 عیب‌یابی

اگر بعد از فعال کردن هنوز خطا می‌گیرید:

### بررسی 1: مطمئن شوید درست فعال کرده‌اید
```
✅ Ethereum → Mainnet → [Enabled]
❌ Ethereum → Sepolia → [Enabled]
```

### بررسی 2: صفحه را Refresh کنید
گاهی Alchemy نیاز به refresh دارد:
1. در صفحه Networks روی F5 بزنید
2. چک کنید که Mainnet هنوز Enabled است

### بررسی 3: App را Restart کنید
اگر باز هم کار نکرد:
1. به Apps برگردید
2. روی App کلیک کنید
3. Settings → روی "Restart" کلیک کنید

---

## 📸 تصویر راهنما

صفحه Networks شما باید اینطور باشد:

```
Ethereum
  ✅ Mainnet                 [Enabled]    ← سبز و فعال
  ⚪ Sepolia                 [Enable]     ← خاکستری و غیرفعال
  ⚪ Holesky                 [Enable]     ← خاکستری و غیرفعال
```

---

**موفق باشید!** 🚀

بعد از فعال کردن Mainnet، همه چیز باید کار کند.
