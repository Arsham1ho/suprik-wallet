# 🔑 مرجع کد اصلی - Saturn Wallet

این فایل حاوی مهم‌ترین بخش‌های کد است که نشان می‌دهد wallet چگونه کار می‌کند.

## 1️⃣ تولید آدرس‌های منحصر به فرد

### فایل: `/utils/wallet.ts`

```typescript
/**
 * Derive blockchain addresses from mnemonic
 * Each user gets unique addresses for each network
 */
export async function deriveAddresses(
  mnemonic: string,
  accountIndex: number = 0
): Promise<{
  solana: string;
  ethereum: string;
  bitcoin: string;
  base: string;
  polygon: string;
  sui: string;
}> {
  const bip39 = await import('@scure/bip39');
  const bip32 = await import('@scure/bip32');
  
  // Convert mnemonic to seed
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  
  // ========== SOLANA ==========
  // BIP44 path: m/44'/501'/accountIndex'/0'
  const solanaPath = `m/44'/501'/${accountIndex}'/0'`;
  const solanaHdKey = bip32.HDKey.fromMasterSeed(seed);
  const solanaAccount = solanaHdKey.derive(solanaPath);
  const solanaKeypair = nacl.sign.keyPair.fromSeed(
    solanaAccount.privateKey.slice(0, 32)
  );
  const solanaAddress = bs58.encode(solanaKeypair.publicKey);
  
  // ========== ETHEREUM ==========
  // BIP44 path: m/44'/60'/0'/0/accountIndex
  const ethPath = `m/44'/60'/0'/0/${accountIndex}`;
  const ethHdKey = bip32.HDKey.fromMasterSeed(seed);
  const ethAccount = ethHdKey.derive(ethPath);
  const publicKeyBytes = ethAccount.publicKey.slice(1);
  const hash = sha3.keccak_256(publicKeyBytes);
  const ethereumAddress = '0x' + Array.from(hash.slice(-20))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Base and Polygon use same address (EVM chains)
  const baseAddress = ethereumAddress;
  const polygonAddress = ethereumAddress;
  
  // ========== BITCOIN ==========
  // BIP44 path: m/44'/0'/0'/0/accountIndex
  const btcPath = `m/44'/0'/0'/0/${accountIndex}`;
  const btcHdKey = bip32.HDKey.fromMasterSeed(seed);
  const btcAccount = btcHdKey.derive(btcPath);
  // ... Bech32 encoding for bc1 addresses ...
  
  // ========== SUI ==========
  // BIP44 path: m/44'/784'/accountIndex'/0'/0'
  const suiPath = `m/44'/784'/${accountIndex}'/0'/0'`;
  // ... Blake2b hashing for Sui address ...
  
  return {
    solana: solanaAddress,
    ethereum: ethereumAddress,
    bitcoin: bitcoinAddress,
    base: baseAddress,
    polygon: polygonAddress,
    sui: suiAddress,
  };
}
```

**نکات کلیدی**:
- همان seed phrase برای تمام شبکه‌ها استفاده می‌شود
- هر شبکه BIP44 path منحصر به فرد دارد
- آدرس‌ها deterministic هستند (همیشه یکسان با همان seed)
- سازگار با Phantom و سایر wallet های BIP44

---

## 2️⃣ بارگذاری موجودی و توکن‌ها

### فایل: `/utils/tokenLoader.ts`

```typescript
/**
 * Load all tokens from blockchain - EXACTLY LIKE PHANTOM
 * Auto-detects ALL SPL tokens and shows them automatically
 */
export async function loadAllTokens(
  addresses: WalletAddresses,
  networkMode: 'mainnet' | 'testnet',
  isTestnet: boolean
): Promise<Token[]> {
  console.log('[TokenLoader] 🚀 Loading tokens in', networkMode, 'mode...');
  
  // 1. Fetch balances from blockchain APIs
  const balances = await fetchAllBalances(addresses, networkMode);
  
  console.log('[TokenLoader] 📊 Blockchain data:');
  console.log('  - SOL balance:', balances.solana.native);
  console.log('  - SPL tokens:', balances.solana.tokens.length);
  console.log('  - ETH balance:', balances.ethereum.native);
  console.log('  - BTC balance:', balances.bitcoin.native);
  
  // 2. Collect symbols for price fetching
  const allSymbols = [
    'SOL', 'ETH', 'BTC',
    ...balances.solana.tokens.map(t => t.symbol),
    ...balances.ethereum.tokens.map(t => t.symbol)
  ];
  
  // 3. Fetch prices from CoinGecko
  const prices = await fetchTokenPrices(allSymbols);
  
  // 4. Build tokens array
  const tokens: Token[] = [];
  
  // Add SOL
  if (balances.solana.native > 0 || !isTestnet) {
    tokens.push({
      symbol: 'SOL',
      amount: balances.solana.native,
      value: balances.solana.native * (prices['SOL'] || 0),
      price: prices['SOL'] || 0,
      network: 'solana'
      // ...
    });
  }
  
  // Add all SPL tokens automatically
  balances.solana.tokens.forEach(token => {
    tokens.push({
      symbol: token.symbol,
      amount: token.amount,
      value: token.amount * (prices[token.symbol] || 0),
      network: 'solana'
      // ...
    });
  });
  
  // Same for ETH and ERC20 tokens...
  
  return tokens;
}
```

**نکات کلیدی**:
- موجودی مستقیم از blockchain خوانده می‌شود
- تمام SPL و ERC20 tokens خودکار شناسایی می‌شوند
- قیمت‌ها از CoinGecko دریافت می‌شوند
- ارزش USD برای هر توکن محاسبه می‌شود

---

## 3️⃣ ارسال توکن (Client-Side Signing)

### فایل: `/utils/transactions.ts`

```typescript
/**
 * Send SOL - 100% Client-Side
 */
export async function sendSolanaTransaction(
  mnemonic: string,
  recipientAddress: string,
  amount: number,
  isTestnet: boolean = false
): Promise<{ signature: string; success: boolean }> {
  
  // 1. Derive keypair from mnemonic (CLIENT-SIDE)
  const keypair = await deriveSolanaKeypair(mnemonic, 0);
  
  // 2. Connect to Solana network
  const connection = await getSolanaConnection(isTestnet);
  
  // 3. Create transaction
  const { Transaction, SystemProgram, PublicKey } = 
    await import('@solana/web3.js');
  
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(recipientAddress),
      lamports: amount * 1e9, // Convert SOL to lamports
    })
  );
  
  // 4. Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = keypair.publicKey;
  
  // 5. Sign transaction (CLIENT-SIDE)
  transaction.sign(keypair);
  
  // 6. Broadcast to blockchain
  const signature = await connection.sendRawTransaction(
    transaction.serialize()
  );
  
  // 7. Confirm transaction
  await connection.confirmTransaction(signature);
  
  return { signature, success: true };
}
```

**نکات کلیدی**:
- Private key هرگز از browser خارج نمی‌شود
- Signing در client انجام می‌شود (مثل Phantom)
- فقط signed transaction به blockchain ارسال می‌شود
- پشتیبانی کامل از testnet و mainnet

---

## 4️⃣ Swap با Jupiter Protocol

### فایل: `/utils/swap.ts`

```typescript
/**
 * Get swap quote from Jupiter
 */
export async function getJupiterSwapQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps: number;
}): Promise<JupiterQuote> {
  
  const response = await fetch(
    `https://quote-api.jup.ag/v6/quote?` +
    `inputMint=${params.inputMint}&` +
    `outputMint=${params.outputMint}&` +
    `amount=${params.amount}&` +
    `slippageBps=${params.slippageBps}`
  );
  
  const quote = await response.json();
  return quote;
}

/**
 * Execute swap - 100% Client-Side
 */
export async function executeJupiterSwap(params: {
  wallet: Keypair;
  quoteResponse: JupiterQuote;
  network: 'mainnet' | 'devnet';
}): Promise<{ signature: string; success: boolean }> {
  
  // 1. Get swap transaction from Jupiter
  const response = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: params.quoteResponse,
      userPublicKey: params.wallet.publicKey.toString(),
    }),
  });
  
  const { swapTransaction } = await response.json();
  
  // 2. Deserialize transaction
  const transaction = Transaction.from(
    Buffer.from(swapTransaction, 'base64')
  );
  
  // 3. Sign transaction (CLIENT-SIDE)
  transaction.sign(params.wallet);
  
  // 4. Send to blockchain
  const connection = await getSolanaConnection(
    params.network === 'devnet'
  );
  const signature = await connection.sendRawTransaction(
    transaction.serialize()
  );
  
  await connection.confirmTransaction(signature);
  
  return { signature, success: true };
}
```

**نکات کلیدی**:
- یکپارچه‌سازی با Jupiter (بهترین DEX aggregator)
- دریافت بهترین قیمت از همه DEXها
- Client-side signing برای امنیت
- پشتیبانی از slippage tolerance

---

## 5️⃣ رمزنگاری و امنیت

### فایل: `/utils/wallet.ts`

```typescript
/**
 * Secure storage with Web Crypto API
 */
export class SecureStorage {
  
  /**
   * Derive encryption key from password using PBKDF2
   */
  private static async deriveKey(
    password: string, 
    salt: Uint8Array
  ): Promise<CryptoKey> {
    
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derive actual encryption key with 100,000 iterations
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
  
  /**
   * Encrypt and store mnemonic
   */
  static async storeMnemonic(
    mnemonic: string, 
    password: string
  ): Promise<void> {
    
    const encoder = new TextEncoder();
    const data = encoder.encode(mnemonic);
    
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derive key from password
    const key = await this.deriveKey(password, salt);
    
    // Encrypt the mnemonic with AES-256-GCM
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Store as base64
    const combined = new Uint8Array(
      salt.length + iv.length + encryptedData.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);
    
    const base64 = btoa(String.fromCharCode(...combined));
    localStorage.setItem('saturn_encrypted_wallet', base64);
  }
}
```

**نکات کلیدی**:
- AES-256-GCM برای رمزنگاری (استاندارد نظامی)
- PBKDF2 با 100,000 iterations برای key derivation
- Random salt و IV برای هر encryption
- Web Crypto API (native browser crypto)

---

## 🎯 خلاصه معماری

```
┌─────────────────────────────────────────────────┐
│           Saturn Wallet Architecture            │
└─────────────────────────────────────────────────┘

1. USER CREATES WALLET
   └─> Generate 12-word seed phrase (BIP39)
   └─> Encrypt with password (AES-256-GCM)
   └─> Store in localStorage

2. DERIVE ADDRESSES (from seed)
   └─> Solana   (m/44'/501'/0'/0')     → Base58
   └─> Ethereum (m/44'/60'/0'/0/0)     → 0x...
   └─> Bitcoin  (m/44'/0'/0'/0/0)      → bc1...
   └─> Base     (same as Ethereum)     → 0x...
   └─> Polygon  (same as Ethereum)     → 0x...
   └─> Sui      (m/44'/784'/0'/0'/0')  → 0x...

3. FETCH BALANCES (from blockchain)
   ┌──> Helius API     → SOL + SPL tokens
   ├──> Alchemy API    → ETH + ERC20 tokens
   └──> Blockchain.info → BTC balance

4. FETCH PRICES
   └─> CoinGecko API → USD prices for all tokens

5. SEND TRANSACTION
   ├─> Derive keypair from seed (client-side)
   ├─> Create & sign transaction (client-side)
   ├─> Broadcast to blockchain
   └─> Confirm & update balance

6. SWAP TOKENS
   ├─> Get quote from Jupiter
   ├─> Create swap transaction
   ├─> Sign transaction (client-side)
   ├─> Execute on blockchain
   └─> Confirm & update balances

ALL PRIVATE KEYS STAY IN BROWSER ✅
ALL SIGNING HAPPENS CLIENT-SIDE ✅
ZERO BACKEND TRUST ✅
```

---

## 📚 فایل‌های کلیدی

| فایل | توضیحات |
|------|---------|
| `/utils/wallet.ts` | تولید seed، derive آدرس‌ها، رمزنگاری |
| `/utils/tokenLoader.ts` | بارگذاری خودکار توکن‌ها |
| `/utils/blockchain.ts` | API calls به blockchain |
| `/utils/transactions.ts` | Client-side signing و send |
| `/utils/swap.ts` | Jupiter integration برای swap |
| `/components/pages/Home.tsx` | صفحه اصلی و نمایش موجودی |
| `/components/pages/Send.tsx` | UI برای ارسال توکن |
| `/components/pages/Swap.tsx` | UI برای swap |
| `/utils/WalletContext.tsx` | Global state management |

---

**✨ تمام این کدها 100% client-side هستند و مانند Phantom عمل می‌کنند!**
