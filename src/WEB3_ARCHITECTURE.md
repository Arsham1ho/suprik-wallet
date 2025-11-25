# 🚀 Saturn Wallet - Web3 Architecture

## معماری جدید (مثل Phantom)

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Web3 Wallet Manager (Client-Side)                 │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │                                                     │   │
│  │  • Generate Seed Phrase (BIP39)                    │   │
│  │  • Derive Keypairs (ED25519-HD-Key)                │   │
│  │  • Encrypt/Decrypt (AES-256 + PBKDF2)              │   │
│  │  • Sign Transactions (Client-Side)                 │   │
│  │  • Local Storage (Encrypted)                       │   │
│  │  • Session Management                              │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Direct RPC Connection                       │   │
│  │         https://api.mainnet-beta.solana.com         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ (Only metadata)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  • User metadata (username, email)                         │
│  • Activity history                                        │
│  • Fee tracking                                            │
│  • ❌ NO private keys                                      │
│  • ❌ NO seed phrases                                      │
│  • ❌ NO transaction signing                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 امنیت

### Client-Side Encryption

```typescript
// 1. Generate seed phrase (12 words)
const seedPhrase = bip39.generateMnemonic(128);
// Example: "word1 word2 word3 ... word12"

// 2. Encrypt with user password
const encrypted = AES.encrypt(seedPhrase, userPassword, {
  mode: CBC,
  padding: PKCS7,
  key: PBKDF2(password, salt, 10000 iterations)
});

// 3. Store encrypted in localStorage
localStorage.setItem('saturn_wallet_' + publicKey, {
  encrypted: encrypted,
  salt: randomSalt,
  iv: randomIV
});

// ❌ Raw seed NEVER stored
// ❌ Password NEVER sent to server
// ✅ Only encrypted data in localStorage
```

### Key Derivation

```typescript
// Solana HD Path: m/44'/501'/0'/0'
const seed = bip39.mnemonicToSeedSync(seedPhrase);
const derivedSeed = derivePath("m/44'/501'/0'/0'", seed);
const keypair = Keypair.fromSeed(derivedSeed);

// Multiple accounts from same seed:
// Account 1: m/44'/501'/0'/0'
// Account 2: m/44'/501'/1'/0'
// Account 3: m/44'/501'/2'/0'
```

---

## 📱 فلوی کاربر

### 1. Create New Wallet

```
User Input Password
       ↓
Generate Seed Phrase (BIP39)
       ↓
Show Seed to User (Write Down!)
       ↓
Verify Seed (Random Words)
       ↓
Encrypt Seed with Password
       ↓
Store in localStorage
       ↓
Wallet Ready! ✅
```

### 2. Import Existing Wallet

```
User Enters Seed Phrase
       ↓
Validate Seed (BIP39)
       ↓
User Creates Password
       ↓
Encrypt Seed with Password
       ↓
Store in localStorage
       ↓
Wallet Ready! ✅
```

### 3. Unlock Wallet

```
User Enters Password
       ↓
Retrieve Encrypted Data from localStorage
       ↓
Decrypt with Password
       ↓
Verify Seed Phrase
       ↓
Set Session (15 minutes)
       ↓
Wallet Unlocked! ✅
```

### 4. Send Transaction

```
User Initiates Send
       ↓
Get Seed from Session
       ↓
Derive Keypair
       ↓
Create Transaction
       ↓
Sign Locally (Client-Side)
       ↓
Send to Solana RPC
       ↓
Confirm & Update UI
```

---

## 🛠️ Components

### 1. **walletManager.ts** (Core Logic)

```typescript
// Key Functions:
- generateSeedPhrase()         // BIP39 12-word mnemonic
- validateSeedPhrase()         // Check validity
- deriveKeypairFromSeed()      // HD derivation
- encryptSeedPhrase()          // AES-256 encryption
- decryptSeedPhrase()          // Decrypt with password
- storeWallet()                // Save to localStorage
- retrieveWallet()             // Load from localStorage
- sendSOL()                    // Sign & send transaction
- getBalance()                 // Query balance
- signTransaction()            // Sign only (no send)
```

### 2. **Web3WalletContext.tsx** (State Management)

```typescript
// Global State:
- isUnlocked: boolean
- currentAccount: WalletAccount
- accounts: WalletAccount[]
- balance: number

// Actions:
- createWallet(password)
- importWallet(seed, password)
- unlockWallet(walletId, password)
- lockWallet()
- send(recipient, amount)
- refreshBalance()
```

### 3. **Web3Setup.tsx** (Onboarding)

```typescript
// Steps:
1. Choice (Create vs Import)
2. Create Password
3. Show Seed Phrase
4. Verify Seed
5. Complete
```

### 4. **UnlockWallet.tsx** (Login)

```typescript
// Features:
- Password entry
- Show/hide password
- Failed attempt tracking
- Lockout after 3 attempts
- 30-second cooldown
```

---

## 💾 Storage

### localStorage Structure

```json
{
  "saturn_wallet_ABC123...": {
    "encrypted": "U2FsdGVkX1...",
    "salt": "a1b2c3d4...",
    "iv": "x7y8z9..."
  },
  "saturn_active_wallet": "ABC123...",
  "saturn_wallet_list": [
    {
      "walletId": "ABC123...",
      "name": "Main Wallet",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Session Storage (RAM only)

```typescript
// Temporary decrypted seed for active session
sessionStorage = {
  seed: "word1 word2 ... word12",
  expiry: timestamp + 15 minutes
}

// Auto-clear on:
- Session timeout (15 min)
- Manual lock
- Browser close
- Tab close
```

---

## 🔄 Transaction Flow

### Send SOL (Web3 Way)

```typescript
// OLD (Backend):
❌ Send seed to server
❌ Server signs transaction
❌ Server sends to blockchain

// NEW (Web3):
✅ Get seed from session (client)
✅ Sign transaction (client)
✅ Send directly to Solana RPC
✅ Server only logs activity
```

### Example Code

```typescript
// Client-side transaction
const { send } = useWeb3Wallet();

const handleSend = async () => {
  const result = await send(recipientAddress, amount);
  
  if (result.success) {
    console.log('Transaction:', result.signature);
    // Log to backend for history
    await logTransaction({
      signature: result.signature,
      type: 'send',
      amount,
      recipient
    });
  }
};
```

---

## 🌐 RPC Connections

### Direct Solana RPC

```typescript
// Mainnet (Production)
const connection = new Connection(
  'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Devnet (Testing)
const connection = new Connection(
  'https://api.devnet.solana.com',
  'confirmed'
);

// Custom RPC (Optional)
const connection = new Connection(
  'https://your-custom-rpc.com',
  'confirmed'
);
```

### RPC Methods Used

```typescript
// Get balance
await connection.getBalance(publicKey);

// Get recent blockhash
await connection.getLatestBlockhash();

// Send transaction
await sendAndConfirmTransaction(connection, transaction, [keypair]);

// Get transaction history
await connection.getSignaturesForAddress(publicKey);

// Get token accounts
await connection.getParsedTokenAccountsByOwner(publicKey);
```

---

## 🔧 Libraries

### Core Dependencies

```json
{
  "@solana/web3.js": "^1.95.8",
  "bip39": "^3.1.0",
  "ed25519-hd-key": "^1.3.0",
  "crypto-js": "^4.2.0"
}
```

### Why These Libraries?

- **@solana/web3.js**: Official Solana SDK
- **bip39**: BIP39 mnemonic generation/validation
- **ed25519-hd-key**: HD key derivation for ED25519
- **crypto-js**: AES encryption for seed phrases

---

## 🚨 Security Best Practices

### ✅ DO

1. **Encrypt everything**
   - Use strong passwords (min 8 chars)
   - PBKDF2 with 10,000 iterations
   - Random salt & IV for each wallet

2. **Client-side only**
   - Never send seed to server
   - Sign transactions locally
   - Keep private keys in memory only

3. **Session management**
   - Auto-lock after 15 minutes
   - Clear on browser close
   - Re-authenticate for sensitive ops

4. **Validate input**
   - Check seed phrase (BIP39)
   - Verify addresses (Base58)
   - Confirm transactions

### ❌ DON'T

1. **Never log sensitive data**
   ```typescript
   ❌ console.log(seedPhrase)
   ❌ console.log(privateKey)
   ✅ console.log(publicKey) // OK
   ```

2. **Never store unencrypted**
   ```typescript
   ❌ localStorage.setItem('seed', seedPhrase)
   ✅ localStorage.setItem('wallet', encrypted)
   ```

3. **Never trust user input**
   ```typescript
   ❌ eval(userInput)
   ❌ new Function(userInput)
   ✅ Always validate & sanitize
   ```

4. **Never skip verification**
   ```typescript
   ❌ Skip seed phrase backup
   ❌ Skip password confirmation
   ✅ Force user to confirm seed
   ```

---

## 📊 Comparison

### Old vs New Architecture

| Feature | Old (Backend) | New (Web3) |
|---------|--------------|------------|
| **Key Storage** | Server database | Client encrypted |
| **Transaction Signing** | Server-side | Client-side |
| **RPC Connection** | Server proxy | Direct connection |
| **Password** | Sent to server | Never leaves device |
| **Security Model** | Trust server | Zero-trust |
| **Recovery** | Server backup | User's seed phrase |
| **Privacy** | Server sees all | Client privacy |

---

## 🎯 Integration Steps

### 1. Wrap App with Context

```tsx
// App.tsx
import { Web3WalletProvider } from './contexts/Web3WalletContext';

function App() {
  return (
    <Web3WalletProvider>
      <YourApp />
    </Web3WalletProvider>
  );
}
```

### 2. Use in Components

```tsx
import { useWeb3Wallet } from './contexts/Web3WalletContext';

function MyComponent() {
  const { 
    isUnlocked, 
    currentAccount, 
    balance,
    send,
    refreshBalance 
  } = useWeb3Wallet();
  
  // Your component logic
}
```

### 3. Handle Unlock State

```tsx
function Main() {
  const { isUnlocked } = useWeb3Wallet();
  
  if (!isUnlocked) {
    return <UnlockWallet />;
  }
  
  return <Dashboard />;
}
```

---

## 🧪 Testing

### Test Scenarios

1. **Create Wallet**
   ```
   ✓ Generate valid 12-word seed
   ✓ Encrypt with password
   ✓ Store in localStorage
   ✓ Derive correct public key
   ```

2. **Import Wallet**
   ```
   ✓ Validate seed phrase
   ✓ Reject invalid seeds
   ✓ Encrypt with password
   ✓ Match expected public key
   ```

3. **Unlock/Lock**
   ```
   ✓ Correct password unlocks
   ✓ Wrong password fails
   ✓ 3 attempts trigger lockout
   ✓ Session expires after 15min
   ```

4. **Transactions**
   ```
   ✓ Sign correctly
   ✓ Send to network
   ✓ Handle errors
   ✓ Update balance
   ```

---

## 🚀 Next Steps

1. **Integrate Web3Setup** into onboarding flow
2. **Replace backend auth** with Web3 auth
3. **Update Send/Swap** to use client-side signing
4. **Add Jupiter integration** with Web3 signing
5. **Implement token support** with SPL Token
6. **Add transaction history** from RPC
7. **Enable NFT support** with Metaplex

---

## 📚 Resources

- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [BIP39 Spec](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [Phantom Wallet](https://phantom.app) - Inspiration
- [Solana Cookbook](https://solanacookbook.com/)

---

**Version**: 2.0.0  
**Architecture**: Web3 Client-Side  
**Security**: Industry Standard  
**Status**: Ready to Deploy 🚀
