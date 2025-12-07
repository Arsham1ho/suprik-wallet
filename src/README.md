# Saturn Wallet 🪐

A modern, Phantom-inspired multi-chain cryptocurrency wallet with a beautiful purple gradient theme.

## Features ✨

### Core Functionality
- **Multi-Chain Support**: Solana, Ethereum, Bitcoin, Base, Polygon, and Sui
- **100% Client-Side**: Private keys never leave your device
- **Auto-Detection**: Automatically detects all SPL and ERC20 tokens
- **Real-time Prices**: Live token prices and portfolio tracking

### Authentication
- **Recovery Phrase**: 12-word BIP39 mnemonic (primary method)
- **Social Login**: Google and Apple sign-in support
- **Biometric Lock**: Face ID / Touch ID / Fingerprint support
- **Auto-Lock**: Configurable timeout

### User Experience
- **Mobile-First**: Optimized for 390x844 iPhone screen
- **PWA Support**: Install as native app on iOS/Android
- **Dark Theme**: Beautiful purple gradient design
- **Smooth Animations**: Polished transitions and interactions
- **Multi-Language**: Support for multiple languages

### Transactions
- **Send**: Transfer tokens to any address
- **Swap**: In-app token swaps
- **Activity**: Complete transaction history
- **Address Book**: Save frequently used addresses

### Security
- **Encrypted Storage**: All sensitive data is encrypted
- **No Backend**: Keys stored only on your device
- **Network Toggle**: Switch between mainnet/testnet
- **Transaction Signing**: Secure blockchain signing

## Tech Stack 🛠

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Backend**: Supabase Edge Functions (Deno)
- **Blockchain APIs**: Helius (Solana), Alchemy (Ethereum)
- **PWA**: Service Workers + Web App Manifest

## Architecture 🏗

```
Saturn Wallet
├── Client-Side (Browser)
│   ├── Wallet Generation (BIP39)
│   ├── Private Key Storage (Encrypted)
│   ├── Transaction Signing
│   └── UI/UX Layer
│
├── Server (Supabase Edge Functions)
│   ├── Blockchain RPC Proxy
│   ├── Token Price Fetching
│   ├── Transaction History
│   └── User Settings Storage
│
└── Blockchain Networks
    ├── Solana (Helius RPC)
    ├── Ethereum (Alchemy)
    ├── Bitcoin
    ├── Base
    ├── Polygon
    └── Sui
```

## Getting Started 🚀

### Prerequisites
- Node.js 18+
- Supabase Account
- Helius API Key (Solana)
- Alchemy API Key (Ethereum)

### Environment Variables
Set these in Supabase Edge Functions:
```bash
HELIUS_API_KEY=your_helius_key
ALCHEMY_API_KEY=your_alchemy_key
RESEND_API_KEY=your_resend_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Security Notes 🔒

- **Never share your recovery phrase**
- **Never screenshot your recovery phrase**
- **Enable biometric lock for additional security**
- **Use testnet mode for testing**
- **Verify all transaction details before confirming**

## License 📄

MIT License - feel free to use this project for your own purposes.

## Support 💬

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Figma Make
