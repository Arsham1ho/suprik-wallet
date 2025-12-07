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
}

const ACCOUNTS_KEY = 'saturn_accounts';
const ACTIVE_ACCOUNT_KEY = 'saturn_active_account_id';

export class AccountManager {
  // Get all accounts
  static getAccounts(): Account[] {
    try {
      const stored = localStorage.getItem(ACCOUNTS_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
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
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    
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
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
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
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filtered));

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
