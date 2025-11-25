# 🎨 Git Workflow - راهنمای تصویری

**برای Fix کردن Package.json Not Found** 🔧

---

## 🗺️ نقشه کلی

```
Local Files → Git → GitHub → Cloudflare
    📁         🔄     ☁️        ⚡
```

---

## 📋 مراحل کامل

### مرحله 1: وضعیت فعلی شما 🔍

```
📁 Project فولدر شما:
   suprik-wallet/
   ├── package.json        ✅
   ├── vite.config.ts      ✅
   ├── index.html          ✅
   ├── App.tsx             ✅
   ├── components/         ✅
   └── ...

❌ مشکل: این فایل‌ها local هستند
❌ GitHub خالی است (یا repository ندارید)
❌ Cloudflare نمی‌تواند ببیند
```

---

### مرحله 2: Git Init 🚀

```bash
git init
```

**قبل:**
```
📁 suprik-wallet/
   ├── package.json
   └── ...
```

**بعد:**
```
📁 suprik-wallet/
   ├── .git/              ← جدید!
   ├── package.json
   └── ...
```

✅ حالا Git tracking می‌کند!

---

### مرحله 3: Git Add 📦

```bash
git add .
```

**چه اتفاقی می‌افتد:**

```
Working Directory    →    Staging Area
    (local)                 (آماده commit)

📁 package.json      →    📦 package.json
📁 vite.config.ts    →    📦 vite.config.ts
📁 index.html        →    📦 index.html
📁 App.tsx           →    📦 App.tsx
...                  →    ...
```

**بررسی:**
```bash
git status

# خروجی:
Changes to be committed:
  new file: package.json ✅
  new file: vite.config.ts ✅
  ...
```

---

### مرحله 4: Git Commit 💾

```bash
git commit -m "Initial commit: Suprik wallet ready"
```

**چه اتفاقی می‌افتد:**

```
Staging Area    →    Git History
  (آماده)            (ذخیره شد)

📦 files        →    💾 Commit #1
                      "Initial commit..."
                      ✅ Saved!
```

**بررسی:**
```bash
git log --oneline

# خروجی:
a1b2c3d Initial commit: Suprik wallet ready ✅
```

---

### مرحله 5: Create GitHub Repository 🌐

```
Browser:
https://github.com/new

┌──────────────────────────────────┐
│ Create a new repository          │
│                                  │
│ Repository name *                │
│ ┌──────────────────────────────┐ │
│ │ suprik-wallet                │ │
│ └──────────────────────────────┘ │
│                                  │
│ Description (optional)           │
│ ┌──────────────────────────────┐ │
│ │ Suprik crypto wallet         │ │
│ └──────────────────────────────┘ │
│                                  │
│ ○ Public  ○ Private              │
│                                  │
│ ⚠️ DON'T Initialize:             │
│ ☐ Add a README                   │
│ ☐ Add .gitignore                 │
│ ☐ Choose a license               │
│                                  │
│     [Create repository]          │
└──────────────────────────────────┘
```

**بعد از create:**

```
✅ GitHub Repository ساخته شد!
📍 URL: https://github.com/YOUR_USERNAME/suprik-wallet
```

---

### مرحله 6: Connect Remote 🔗

```bash
git remote add origin https://github.com/YOUR_USERNAME/suprik-wallet.git
git branch -M main
```

**چه اتفاقی می‌افتد:**

```
Local Git      ←→      GitHub Remote
   💻                      ☁️
   
Your Computer          github.com
suprik-wallet    →     YOUR_USERNAME/suprik-wallet
   (local)                 (empty)
```

**بررسی:**
```bash
git remote -v

# خروجی:
origin  https://github.com/YOUR_USERNAME/suprik-wallet.git (fetch)
origin  https://github.com/YOUR_USERNAME/suprik-wallet.git (push) ✅
```

---

### مرحله 7: Git Push ⬆️

```bash
git push -u origin main
```

**چه اتفاقی می‌افتد:**

```
Local                Push →              GitHub
💻                                       ☁️

📦 package.json      →→→→→      📦 package.json
📦 vite.config.ts    →→→→→      📦 vite.config.ts
📦 index.html        →→→→→      📦 index.html
📦 App.tsx           →→→→→      📦 App.tsx
📦 components/       →→→→→      📦 components/
...                  →→→→→      ...
```

**خروجی Terminal:**

```
Enumerating objects: 150, done.
Counting objects: 100% (150/150), done.
Delta compression using up to 8 threads
Compressing objects: 100% (120/120), done.
Writing objects: 100% (150/150), 50.00 KiB | 5.00 MiB/s, done.
Total 150 (delta 25), reused 0 (delta 0)
To https://github.com/YOUR_USERNAME/suprik-wallet.git
 * [new branch]      main -> main ✅
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

### مرحله 8: بررسی در GitHub ✅

```
Browser:
https://github.com/YOUR_USERNAME/suprik-wallet

┌───────────────────────────────────────┐
│ YOUR_USERNAME / suprik-wallet         │
│                                       │
│ 📁 components/                        │
│ 📁 utils/                             │
│ 📁 styles/                            │
│ 📄 package.json          ← اینجا! ✅  │
│ 📄 vite.config.ts                     │
│ 📄 index.html                         │
│ 📄 App.tsx                            │
│ 📄 README.md                          │
│ ...                                   │
│                                       │
│ "Initial commit: Suprik wallet ready" │
│ committed by YOU, 2 minutes ago       │
└───────────────────────────────────────┘
```

✅ همه فایل‌ها در GitHub هستند!

---

### مرحله 9: Connect Cloudflare 🌩️

```
Browser:
https://dash.cloudflare.com

1. Workers & Pages

┌───────────────────────────────────────┐
│ Workers & Pages                       │
│                                       │
│     [Create application]              │
│            ↓ کلیک                     │
└───────────────────────────────────────┘

2. انتخاب Pages

┌───────────────────────────────────────┐
│ Create an application                 │
│                                       │
│   Workers          Pages              │
│   [────────]    [────────] ← انتخاب  │
└───────────────────────────────────────┘

3. Connect to Git

┌───────────────────────────────────────┐
│ Connect your Git provider             │
│                                       │
│   GitHub      GitLab      Bitbucket   │
│   [────]      [────]      [────]      │
│     ↑ انتخاب                          │
└───────────────────────────────────────┘

4. انتخاب Repository

┌───────────────────────────────────────┐
│ Select a repository                   │
│                                       │
│ Search: suprik                        │
│                                       │
│ ○ YOUR_USERNAME/suprik-wallet ← این!  │
│ ○ OTHER_REPO/name                     │
│                                       │
│     [Begin setup]                     │
└───────────────────────────────────────┘
```

---

### مرحله 10: Build Configuration ⚙️

```
┌───────────────────────────────────────┐
│ Set up builds and deployments         │
│                                       │
│ Project name                          │
│ ┌───────────────────────────────────┐ │
│ │ suprik-wallet                     │ │
│ └───────────────────────────────────┘ │
│                                       │
│ Production branch                     │
│ ┌───────────────────────────────────┐ │
│ │ main                              │ │
│ └───────────────────────────────────┘ │
│                                       │
│ Framework preset                      │
│ ┌───────────────────────────────────┐ │
│ │ Vite                         ▼   │ │
│ └───────────────────────────────────┘ │
│                                       │
│ Build command                         │
│ ┌───────────────────────────────────┐ │
│ │ npm run build                     │ │
│ └───────────────────────────────────┘ │
│                                       │
│ Build output directory                │
│ ┌───────────────────────────────────┐ │
│ │ dist                              │ │
│ └───────────────────────────────────┘ │
└───────────────────────────────────────┘
```

---

### مرحله 11: Environment Variables 🔑

```
┌───────────────────────────────────────┐
│ Environment variables                 │
│                                       │
│ [Add variable]                        │
│                                       │
│ Variable name                         │
│ ┌───────────────────────────────────┐ │
│ │ VITE_SUPABASE_URL                 │ │
│ └───────────────────────────────────┘ │
│                                       │
│ Value                                 │
│ ┌───────────────────────────────────┐ │
│ │ https://qagsgxsaxspomcysaesa...   │ │
│ └───────────────────────────────────┘ │
│                                       │
│ [Add variable]                        │
└───────────────────────────────────────┘

همین کار را برای:
✅ VITE_SUPABASE_ANON_KEY
✅ VITE_SUPABASE_SERVICE_ROLE_KEY
```

---

### مرحله 12: Deploy! 🚀

```
[Save and Deploy]
       ↓ کلیک

┌───────────────────────────────────────┐
│ Building your site...                 │
│                                       │
│ ⏳ Initializing build environment     │
│ ⏳ Cloning repository                 │
│ ✅ Found package.json ← این مهم!      │
│ ⏳ Installing dependencies            │
│ ⏳ Running: npm run build             │
│ ⏳ Uploading...                       │
│                                       │
│ Estimated time: 2-4 minutes           │
└───────────────────────────────────────┘
```

**بعد از 2-4 دقیقه:**

```
┌───────────────────────────────────────┐
│ ✅ Deployment successful!              │
│                                       │
│ Your site is live at:                 │
│ https://suprik-wallet-abc.pages.dev   │
│                                       │
│     [Visit site]                      │
└───────────────────────────────────────┘
```

---

## 🎉 تبریک! مراحل کامل

```
✅ Git initialized
✅ Files committed locally
✅ GitHub repository created
✅ Files pushed to GitHub
✅ Cloudflare connected to GitHub
✅ Build configured
✅ Environment variables added
✅ Site deployed!
✅ Live at: https://suprik-wallet-xxx.pages.dev
```

---

## 🔄 Workflow آینده (Updates)

```
1. تغییرات local:
   📝 Edit files

2. Save و commit:
   git add .
   git commit -m "Update feature"

3. Push:
   git push

4. Cloudflare auto-deploy:
   ⚡ خودکار rebuild می‌شود!
   ⚡ 2 دقیقه صبر کنید
   ✅ Live updated!
```

---

## 📊 نمودار کامل

```
┌──────────────┐
│ Local Files  │
│  📁 Project  │
└──────┬───────┘
       │ git init
       │ git add .
       │ git commit
       ↓
┌──────────────┐
│ Local Git    │
│  💾 History  │
└──────┬───────┘
       │ git push
       ↓
┌──────────────┐
│   GitHub     │
│ ☁️ Remote    │
└──────┬───────┘
       │ Clone
       ↓
┌──────────────┐
│  Cloudflare  │
│ ⚡ Pages     │
└──────┬───────┘
       │ Build & Deploy
       ↓
┌──────────────┐
│  Live Site   │
│ 🌍 Public    │
└──────────────┘
```

---

## 🎯 Key Points

```
✅ Local → Git → GitHub → Cloudflare → Live
✅ package.json باید در GitHub باشد
✅ Cloudflare از GitHub clone می‌کند
✅ بدون Git push، Cloudflare نمی‌تواند ببیند
✅ Environment variables در Cloudflare Dashboard
```

---

**🎨 با این workflow، همه چیز کار می‌کند! 🚀**
