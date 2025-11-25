# 🪐 Saturn Wallet

**کیف پول وب ۳ حرفه‌ای - سریع، امن، زیبا**

یک کیف پول ارز دیجیتال مدرن و multi-chain که دقیقاً مثل Phantom Wallet عمل می‌کند و طراحی شده تا بهترین تجربه کاربری را در وب و موبایل ارائه دهد.

![Saturn Wallet](https://img.shields.io/badge/Version-1.0.0-purple)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ امکانات

### 🔐 امنیت
- **100% Client-Side**: تمام عملیات wallet در مرورگر انجام می‌شود
- **رمزنگاری AES-256**: ذخیره‌سازی امن recovery phrase
- **Biometric Lock**: قفل اثر انگشت/Face ID
- **Auto-Lock**: قفل خودکار بعد از مدت زمان مشخص
- **Recovery Phrase**: 12 کلمه‌ای با پشتیبان BIP39

### 🌐 Multi-Chain
- **Solana**: خرید، فروش، ارسال، swap
- **Ethereum**: تراکنش‌ها و مدیریت توکن‌ها
- **Base**: پشتیبانی کامل از شبکه Base

### 💸 تراکنش‌ها
- **Send**: ارسال سریع توکن‌ها
- **Receive**: دریافت با QR code
- **Swap**: تبادل توکن‌ها با Jupiter و Raydium
- **History**: تاریخچه کامل تراکنش‌ها
- **Real-time Balance**: موجودی لحظه‌ای

### 👥 Multi-Account
- **Account Switcher**: چند حساب در یک wallet
- **Custom Usernames**: نام کاربری منحصر به فرد
- **Avatar Customization**: شخصی‌سازی آواتار
- **Independent Balances**: موجودی مجزا برای هر حساب

### 📱 Progressive Web App
- **Install**: نصب به عنوان اپلیکیشن
- **Offline**: کار در حالت آفلاین
- **Push Notifications**: اعلان‌ها (آینده)
- **Fast Loading**: بارگذاری فوق سریع

### 🎨 UI/UX
- **Mobile-First**: طراحی برای موبایل
- **Responsive**: سازگار با تمام صفحه‌ها
- **Dark Theme**: تم تیره با gradient بنفش
- **Smooth Animations**: انیمیشن‌های روان
- **Persian Support**: پشتیبانی کامل از فارسی

---

## 🚀 شروع سریع

### نیازمندی‌ها
- Node.js 18+
- npm یا yarn
- حساب Supabase (رایگان)
- Alchemy API Key (رایگان)
- Helius API Key (رایگان)

### نصب

```bash
# Clone repository
git clone https://github.com/yourusername/saturn-wallet.git
cd saturn-wallet

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

در فایل `.env.local`:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Blockchain APIs
ALCHEMY_API_KEY=your_alchemy_key
HELIUS_API_KEY=your_helius_key

# Fee Collection
APP_FEE_WALLET=your_solana_address

# Email (Optional)
RESEND_API_KEY=your_resend_key
```

---

## 📖 استفاده

### ساخت Wallet جدید

1. اپ را باز کنید
2. "Create New Wallet" را انتخاب کنید
3. "Recovery Phrase" را انتخاب کنید
4. 12 کلمه را یادداشت کنید
5. کلمات را تایید کنید
6. رمز عبور تنظیم کنید
7. آماده است! 🎉

### Import Wallet موجود

1. "I Already Have a Wallet" را انتخاب کنید
2. "Recovery Phrase" را انتخاب کنید
3. 12 کلمه را وارد کنید
4. رمز عبور تنظیم کنید
5. وارد شوید!

### ارسال توکن

1. به صفحه Home بروید
2. توکن مورد نظر را انتخاب کنید
3. "Send" را بزنید
4. آدرس و مقدار را وارد کنید
5. تراکنش را تایید کنید

### Swap توکن‌ها

1. به صفحه Swap بروید
2. توکن مبدا و مقصد را انتخاب کنید
3. مقدار را وارد کنید
4. "Review Swap" را بزنید
5. تایید کنید!

### اضافه کردن حساب جدید

1. به Settings > Account Settings بروید
2. "Add Another Account" را بزنید
3. نام کاربری انتخاب کنید
4. حساب جدید آماده است!

---

## 🏗️ معماری

### Frontend
- **React 18** + **TypeScript**
- **Tailwind CSS v4**
- **Motion/React** for animations
- **Shadcn/UI** components
- **Client-side wallet generation**

### Backend
- **Supabase Edge Functions** (Hono)
- **KV Store** برای داده‌ها
- **Serverless** architecture
- **RESTful API**

### Blockchain
- **Alchemy** - Ethereum & Base
- **Helius** - Solana
- **Jupiter/Raydium** - Swap
- **Direct RPC** - Transaction signing

### Security
- **BIP39** - Mnemonic generation
- **AES-256** - Encryption
- **Client-side** - No server storage of keys
- **Biometric** - Device authentication

---

## 📁 ساختار پروژه

```
saturn-wallet/
├── components/          # React components
│   ├── pages/          # Page components
│   ├── ui/             # Shadcn UI components
│   └── mobile/         # Mobile-specific components
├── utils/              # Utilities
│   ├── wallet.ts       # Wallet operations
│   ├── blockchain.ts   # Blockchain interactions
│   ├── swap.ts         # Swap functionality
│   └── biometric.ts    # Biometric auth
├── supabase/
│   └── functions/
│       └── server/     # Edge functions
├── styles/             # Global styles
├── public/             # Static files
│   ├── manifest.json   # PWA manifest
│   └── sw.js          # Service worker
└── App.tsx            # Main app component
```

---

## 🔧 توسعه

### دستورات مفید

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Adding New Features

1. Component جدید در `/components` بسازید
2. State management در context اضافه کنید
3. UI با Tailwind style کنید
4. Testing کنید
5. Document کنید

### Testing Checklist

- ✅ Wallet creation
- ✅ Send/Receive
- ✅ Swap functionality
- ✅ Account switching
- ✅ Biometric lock
- ✅ Responsive design
- ✅ PWA features

---

## 🤝 مشارکت

Contributions خوشحال می‌شویم! لطفاً:

1. Fork کنید
2. Feature branch بسازید: `git checkout -b feature/amazing`
3. Commit کنید: `git commit -m 'Add amazing feature'`
4. Push کنید: `git push origin feature/amazing`
5. Pull Request باز کنید

---

## 📝 License

MIT License - [LICENSE](LICENSE) را ببینید

---

## 🙏 تشکرات

- **Phantom Wallet** - Design inspiration
- **Solana Foundation** - Blockchain infrastructure
- **Supabase** - Backend infrastructure
- **Shadcn** - UI components
- **Community** - Feedback and support

---

## 📞 پشتیبانی

مشکلی پیش آمد؟

- 📧 Email: support@saturnwallet.app
- 🐦 Twitter: [@SaturnWallet](https://twitter.com/saturnwallet)
- 💬 Discord: [Join our server](https://discord.gg/saturn)
- 📖 Docs: [docs.saturnwallet.app](https://docs.saturnwallet.app)

---

## 🗺️ Roadmap

### نسخه 1.1 (به زودی)
- [ ] OAuth Login (Google/Apple)
- [ ] Email/Password Login
- [ ] NFT Gallery improvements
- [ ] Advanced swap options
- [ ] Price charts

### نسخه 1.2 (آینده)
- [ ] Staking
- [ ] DeFi integrations
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Advanced security features

### نسخه 2.0 (Long-term)
- [ ] Desktop app
- [ ] Browser extension
- [ ] Hardware wallet support
- [ ] Multi-sig wallets
- [ ] DAO governance

---

## ⚡ Performance

- **First Load**: < 2s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: 95+
- **Bundle Size**: < 500KB
- **PWA Ready**: ✅

---

## 🎯 Saturn vs Phantom

| Feature | Saturn | Phantom |
|---------|--------|---------|
| Multi-chain | ✅ Solana + ETH + Base | 🟡 Solana only |
| Multi-account | ✅ Unlimited | ✅ Unlimited |
| Open Source | ✅ Yes | ❌ No |
| PWA | ✅ Yes | ❌ No |
| Client-side | ✅ 100% | ✅ 100% |
| Persian Support | ✅ Yes | ❌ No |
| Free | ✅ Yes | ✅ Yes |

---

<div align="center">

**ساخته شده با ❤️ در ایران**

[Website](https://saturnwallet.app) • [Docs](https://docs.saturnwallet.app) • [Twitter](https://twitter.com/saturnwallet) • [Discord](https://discord.gg/saturn)

</div>
