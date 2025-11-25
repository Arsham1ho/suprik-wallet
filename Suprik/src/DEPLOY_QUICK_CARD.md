# 🎯 Deploy Quick Reference Card

## آماده Deploy؟ این برگه را کنار دست نگه دارید!

---

## 📋 Environment Variables کپی کنید:

### ✅ از قبل آماده (کپی کنید):

```bash
VITE_SUPABASE_URL=https://qagsgxsaxspomcysaesa.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZ3NneHNheHNwb21jeXNhZXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNTEzMTIsImV4cCI6MjA3NzYyNzMxMn0.nXIq2kt816zG1yTPfG-FPDPubnPZ2n5tpQ7MFAB6sVM
```

### ⚠️ از `.env.local` خود کپی کنید:

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db...
```

### 🔵 اختیاری (بعداً):

```bash
VITE_HELIUS_API_KEY=
VITE_ALCHEMY_API_KEY=
APP_FEE_WALLET=
RESEND_API_KEY=
```

---

## 🚀 مراحل Deploy (خلاصه):

```
1. ورود به Vercel.com → Continue with GitHub

2. New Project → Import Repository

3. Configure Project:
   ├─ Project Name: suprik-wallet
   ├─ Framework: Vite
   └─ Environment Variables: (لیست بالا را اضافه کنید)

4. Deploy بزنید!

5. صبر کنید 2-5 دقیقه

6. ✓ Live است! → Visit بزنید
```

---

## ⚡ دستورات مفید:

```bash
# چک کردن Git status
git status

# Commit و Push
git add .
git commit -m "Update"
git push

# اگر .env.local اشتباهی add شد
git rm --cached .env.local
git commit -m "Remove .env.local"
git push
```

---

## 🔗 لینک‌های سریع:

| سرویس | URL |
|-------|-----|
| 🟣 **Vercel Dashboard** | https://vercel.com/dashboard |
| 🟢 **Supabase Dashboard** | https://supabase.com/dashboard/project/qagsgxsaxspomcysaesa |
| 🔵 **Helius** | https://www.helius.dev |
| 🟠 **Alchemy** | https://www.alchemy.com |

---

## ❌ خطاهای رایج:

| خطا | راه حل |
|-----|--------|
| Environment variable not found | Settings → Environment Variables → Add |
| Build failed | Check logs → Fix → Redeploy |
| Supabase connection failed | Check SUPABASE_URL & ANON_KEY |
| 404 on deploy | Check Framework Preset = Vite |

---

## 🔄 Redeploy چطور؟

```
Vercel Dashboard
  → Deployments
    → آخرین build
      → "..." menu
        → Redeploy
```

---

## ✅ چک‌لیست قبل از Deploy:

- [ ] `.env.local` در `.gitignore` است
- [ ] `git status` هیچ فایل .env نشان نمی‌دهد
- [ ] تمام Environment Variables آماده است
- [ ] Supabase project فعال است
- [ ] GitHub repository (private) ساخته شده

---

## 📞 نیاز به کمک؟

1. فایل کامل: `/VERCEL_DEPLOY_STEP_BY_STEP.md`
2. Environment Variables: `/ENV_SETUP_GUIDE.md`
3. Quick Setup: `/QUICK_ENV_SETUP_FA.md`

---

**بزنید بریم! 🚀**

این کارت را Print کنید یا در مرورگر باز نگه دارید!
