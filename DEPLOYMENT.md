# Suprik Wallet Deployment Guide

## Quick Deploy

### Vercel (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables:
   ```
   VITE_HELIUS_API_KEY=your_helius_key
   VITE_ALCHEMY_API_KEY=your_alchemy_key
   VITE_JUPITER_API_KEY=your_jupiter_key
   ```

3. **Deploy**
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Click Deploy

### Netlify

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

2. **Configure Environment Variables**
   In Netlify Dashboard → Site settings → Environment variables:
   ```
   VITE_HELIUS_API_KEY=your_helius_key
   VITE_ALCHEMY_API_KEY=your_alchemy_key
   VITE_JUPITER_API_KEY=your_jupiter_key
   ```

3. **Deploy**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Click Deploy

---

## Environment Variables

| Variable | Required | Description | Get Key |
|----------|----------|-------------|---------|
| `VITE_HELIUS_API_KEY` | Yes | Solana RPC provider | [helius.dev](https://helius.dev) |
| `VITE_ALCHEMY_API_KEY` | No | Ethereum/Polygon RPC | [alchemy.com](https://alchemy.com) |
| `VITE_JUPITER_API_KEY` | Yes | Token swap API | [portal.jup.ag](https://portal.jup.ag/api-keys) |

**Note:** Users can also configure their own API keys in Settings → API Keys within the app.

---

## Build Commands

```bash
# Development
npm run dev

# Production build (with version bump)
npm run build

# Production build (without version bump)
npm run build:no-bump

# Preview production build locally
npm run preview

# Type checking
npm run lint

# Clean build cache
npm run clean
```

---

## Project Structure

```
suprik-wallet/
├── build/              # Production build output
├── public/             # Static assets
│   ├── manifest.json   # PWA manifest
│   ├── sw.js           # Service worker
│   └── icons/          # App icons
├── src/
│   ├── components/     # React components
│   ├── utils/          # Utilities & helpers
│   └── App.tsx         # Main app component
├── .env.example        # Environment template
├── vercel.json         # Vercel config
├── netlify.toml        # Netlify config
└── vite.config.ts      # Vite build config
```

---

## Security Features

- **API Keys**: Encrypted with AES-256-GCM before localStorage storage
- **Wallet Keys**: Never leave the device, stored encrypted
- **Headers**: X-Frame-Options, X-Content-Type-Options, XSS Protection
- **HTTPS**: Required for all production deployments

---

## PWA Support

Suprik Wallet is a Progressive Web App with:
- Offline support via Service Worker
- Install prompt on supported devices
- Native-like experience on mobile

---

## Troubleshooting

### Build Fails
```bash
npm run clean
rm -rf node_modules
npm install
npm run build
```

### API Keys Not Working
- Ensure variables start with `VITE_`
- Redeploy after adding environment variables
- Check browser console for errors

### Service Worker Issues
```bash
# Force update service worker version
npm run version:patch
npm run build
```

---

## Platform Fee

Suprik collects a 0.5% platform fee on swaps, sent to:
```
93QBsBSLuzmV1DDFiuLLKmhxk6meRAyiXkpxZ3zbDkLD
```

---

## Support

- Issues: [GitHub Issues](https://github.com/suprik/suprik-wallet/issues)
- Documentation: [docs.suprik.io](https://docs.suprik.io)
