# 🔧 Fix کردن Build Error در Cloudflare

**خطاها:**
1. ⚠️ Duplicate dependency: "vite" specified twice
2. ❌ npm error: Cannot fetch @jsr/supabase__supabase-js

---

## ✅ راه حل (3 دقیقه)

### مرحله 1: Clean Install Local

در terminal خودتان:

```bash
# 1. پاک کردن node_modules و lock files
rm -rf node_modules package-lock.json

# 2. نصب مجدد
npm install

# 3. تست build local
npm run build
```

**اگر در Windows هستید:**

```cmd
rmdir /s /q node_modules
del package-lock.json
npm install
npm run build
```

---

### مرحله 2: Commit و Push

بعد از install موفق:

```bash
# اضافه کردن package-lock.json جدید
git add package-lock.json

# Commit
git commit -m "Fix: Rebuild package-lock.json"

# Push
git push origin main
```

---

### مرحله 3: Retry در Cloudflare

```
1. Cloudflare Dashboard
2. Workers & Pages > suprik-wallet
3. Deployments tab
4. کلیک "Retry deployment"
```

---

## 🔍 چرا این مشکل پیش آمد؟

```
❌ package-lock.json corrupt شده یا outdated است
❌ یا اصلاً وجود ندارد
❌ npm cache ممکن است مشکل داشته باشد
```

---

## 🎯 اگر هنوز error داشتید

### روش جایگزین: نصب با --legacy-peer-deps

```bash
# پاک کردن
rm -rf node_modules package-lock.json

# نصب با flag
npm install --legacy-peer-deps

# Build
npm run build

# اگر موفق شد:
git add package-lock.json
git commit -m "Fix: Install with legacy-peer-deps"
git push origin main
```

---

## 📋 Checklist

```
□ node_modules پاک شد
□ package-lock.json پاک شد
□ npm install اجرا شد
□ npm run build موفق شد (local)
□ package-lock.json جدید commit شد
□ push به GitHub شد
□ در Cloudflare retry کردم
```

---

## ✅ بعد از Fix

```
✅ npm install در Cloudflare موفق می‌شود
✅ Build successful
✅ Deploy می‌شود!
```

---

**🚀 این commands را local اجرا کنید و دوباره push کنید!**
