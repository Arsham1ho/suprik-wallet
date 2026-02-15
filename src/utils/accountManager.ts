// Account Manager - Manages multiple accounts/wallets for Saturn Wallet
// Exactly like Phantom wallet's multi-account system

export interface Account {
  id: string;
  name: string;
  accountIndex: number;
  addresses: {
    solana: string;
    ethereum: string;
  };
  profilePicture?: string;
  selectedEmoji?: string;
  createdAt: number;
  // If true, this account was imported from a different seed phrase
  // and its addresses should NOT be overwritten by WalletContext derivation
  isImportedSeedPhrase?: boolean;
  // If true, this account was imported via private key (not seed phrase)
  isPrivateKeyImport?: boolean;
  // Encrypted mnemonic for imported accounts (encrypted with wallet password)
  // This allows transactions to work for accounts from different seed phrases
  encryptedMnemonic?: string;
  // Encrypted private key for private key imports
  encryptedPrivateKey?: string;
  // Wallet ID for imported seed phrase accounts (used to retrieve mnemonic from saturn_imported_mnemonics)
  importedWalletId?: string;
  // Solana address for imported private key accounts (used to retrieve key from saturn_imported_private_keys)
  importedPrivateKeyAddress?: string;
}

const ACCOUNTS_KEY = 'saturn_accounts';
const ACTIVE_ACCOUNT_KEY = 'saturn_active_account_id';
const INTEGRITY_KEY = 'saturn_accounts_ck';

export class AccountManager {
  // Compute a checksum of account data for tamper detection.
  // Protects against extension/DevTools/cross-tab localStorage modifications.
  private static computeChecksum(data: string): string {
    const pepper = '\x73\x57\x6b\x5f\x61\x32'; // embedded pepper
    const input = pepper + data;
    let h = 0x12345678;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = (h << 13) | (h >>> 19);
      h = Math.imul(h, 0x5bd1e995);
      h ^= h >>> 15;
    }
    return (h >>> 0).toString(36);
  }

  // Save accounts with integrity checksum
  private static saveAccounts(accounts: Account[]): void {
    const data = JSON.stringify(accounts);
    localStorage.setItem(ACCOUNTS_KEY, data);
    localStorage.setItem(INTEGRITY_KEY, this.computeChecksum(data));
  }

  // Verify integrity of stored accounts
  private static verifyIntegrity(data: string): boolean {
    const storedChecksum = localStorage.getItem(INTEGRITY_KEY);
    if (!storedChecksum) {
      // First run or migration — compute and store checksum
      localStorage.setItem(INTEGRITY_KEY, this.computeChecksum(data));
      return true;
    }
    return storedChecksum === this.computeChecksum(data);
  }

  // Get all accounts (with automatic deduplication)
  static getAccounts(): Account[] {
    try {
      const stored = localStorage.getItem(ACCOUNTS_KEY);
      if (!stored) return [];

      // Verify data hasn't been tampered with
      if (!this.verifyIntegrity(stored)) {
        console.error('[AccountManager] Account data integrity check failed — possible tampering');
        window.dispatchEvent(new CustomEvent('accountsTampered'));
      }

      const accounts: Account[] = JSON.parse(stored);

      // Deduplicate accounts by Solana address (keep the first occurrence)
      const seen = new Set<string>();
      const deduplicated = accounts.filter(account => {
        const solanaAddress = account.addresses?.solana;
        if (!solanaAddress || seen.has(solanaAddress)) {
          return false;
        }
        seen.add(solanaAddress);
        return true;
      });

      // If duplicates were found, save the cleaned list
      if (deduplicated.length !== accounts.length) {
        console.log('[AccountManager] Removed', accounts.length - deduplicated.length, 'duplicate accounts');
        this.saveAccounts(deduplicated);
      }

      return deduplicated;
    } catch (error) {
      console.error('[AccountManager] Error loading accounts:', error);
      return [];
    }
  }

  // Get active account ID
  static getActiveAccountId(): string | null {
    return localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  }

  // Get active account
  static getActiveAccount(): Account | null {
    const accounts = this.getAccounts();
    const activeId = this.getActiveAccountId();
    return accounts.find(acc => acc.id === activeId) || accounts[0] || null;
  }

  // Set active account
  static setActiveAccount(accountId: string): void {
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, accountId);
  }

  // Add new account
  static addAccount(account: Account): void {
    const accounts = this.getAccounts();
    accounts.push(account);
    this.saveAccounts(accounts);

    // If this is the first account, make it active
    if (accounts.length === 1) {
      this.setActiveAccount(account.id);
    }
  }

  // Update account
  static updateAccount(accountId: string, updates: Partial<Account>): void {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(acc => acc.id === accountId);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...updates };
      this.saveAccounts(accounts);
    }
  }

  // Delete account
  static deleteAccount(accountId: string): boolean {
    const accounts = this.getAccounts();
    if (accounts.length <= 1) {
      console.warn('[AccountManager] Cannot delete the last account');
      return false;
    }

    const filtered = accounts.filter(acc => acc.id !== accountId);
    this.saveAccounts(filtered);

    // If deleted account was active, switch to first account
    if (this.getActiveAccountId() === accountId) {
      this.setActiveAccount(filtered[0].id);
    }

    return true;
  }

  // Get account by ID
  static getAccountById(accountId: string): Account | null {
    const accounts = this.getAccounts();
    return accounts.find(acc => acc.id === accountId) || null;
  }

  // Get account by index
  static getAccountByIndex(accountIndex: number): Account | null {
    const accounts = this.getAccounts();
    return accounts.find(acc => acc.accountIndex === accountIndex) || null;
  }

  // Initialize first account (called during wallet setup)
  static initializeFirstAccount(
    walletId: string,
    addresses: { solana: string; ethereum: string },
    username?: string
  ): Account {
    const existingAccounts = this.getAccounts();
    
    // If account already exists, return it
    if (existingAccounts.length > 0) {
      return existingAccounts[0];
    }

    const firstAccount: Account = {
      id: walletId,
      name: username || 'Account 1',
      accountIndex: 0,
      addresses,
      createdAt: Date.now(),
    };

    this.addAccount(firstAccount);
    return firstAccount;
  }

  // Create new account with next available index
  static createNewAccount(
    walletId: string,
    addresses: { solana: string; ethereum: string }
  ): Account {
    const accounts = this.getAccounts();
    const nextIndex = accounts.length;
    const nextNumber = nextIndex + 1;

    const newAccount: Account = {
      id: `${walletId}_account_${nextIndex}`,
      name: `Account ${nextNumber}`,
      accountIndex: nextIndex,
      addresses,
      createdAt: Date.now(),
    };

    this.addAccount(newAccount);
    return newAccount;
  }

  // Get next account index
  static getNextAccountIndex(): number {
    const accounts = this.getAccounts();
    return accounts.length;
  }

  // Rename account
  static renameAccount(accountId: string, newName: string): void {
    this.updateAccount(accountId, { name: newName });
  }

  // Update account avatar
  static updateAccountAvatar(
    accountId: string,
    profilePicture?: string,
    selectedEmoji?: string
  ): void {
    this.updateAccount(accountId, { profilePicture, selectedEmoji });
  }

  // Check if account exists
  static accountExists(accountId: string): boolean {
    return this.getAccountById(accountId) !== null;
  }

  // Get accounts count
  static getAccountsCount(): number {
    return this.getAccounts().length;
  }
}
