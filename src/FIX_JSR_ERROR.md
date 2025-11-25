# ✅ Fix کردن JSR/Supabase Error

## مشکل اصلی

```
❌ '@jsr/supabase__supabase-js@^2.49.8' is not in this registry
```

**علت:** npm در حال تلاش برای نصب Deno dependency است که در `/supabase/functions/server/kv_store.tsx` وجود دارد.

---

## ✅ راه حل اعمال شد

این تغییرات انجام شد:

### 1. ✅ vite.config.ts - Exclude backend files
```typescript
optimizeDeps: {
  exclude: ['supabase'],
},
build: {
  rollupOptions: {
    external: [/^\/supabase\//],
  },
}
```

### 2. ✅ tsconfig.json - Exclude supabase folder
```json
{
  "exclude": ["node_modules", "supabase", "dist"]
}
```

### 3. ✅ .gitignore - ساخته شد
### 4. ✅ .npmrc - تنظیم npm registry

---

## 🚀 حالا این کارها را انجام دهید

### مرحله 1: Clean Install

```bash
# پاک کردن
rm -rf node_modules package-lock.json

# نصب مجدد
npm install

# باید موفق شود! ✅
```

### مرحله 2: Test Build

```bash
npm run build
```

**باید پیام موفقیت ببینید:**
```
✓ built in 3.45s
```

### مرحله 3: Commit & Push

```bash
git add .
git commit -m "Fix: Exclude Deno backend from npm build"
git push origin main
```

### مرحله 4: Cloudflare Retry

```
Cloudflare Dashboard > Deployments > Retry deployment
```

---

## 🔍 چرا این کار می‌کند؟

```
قبل:
❌ npm سعی می‌کرد تمام .tsx files را process کند
❌ از جمله /supabase/functions/server/kv_store.tsx
❌ که syntax Deno دارد (jsr:@supabase/supabase-js)
❌ npm نمی‌تواند jsr: را handle کند

بعد:
✅ Vite فولدر supabase را ignore می‌کند
✅ TypeScript فولدر supabase را exclude می‌کند
✅ فقط frontend files build می‌شوند
✅ Backend files برای Supabase Edge Functions است
```

---

## ✅ Checklist

```
□ rm -rf node_modules package-lock.json
□ npm install (موفق شد)
□ npm run build (موفق شد)
□ git add .
□ git commit
□ git push origin main
□ Cloudflare retry
```

---

**🎯 این خطا دیگر نباید برگردد!**
