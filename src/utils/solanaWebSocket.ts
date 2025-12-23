/**
 * Solana WebSocket Service - Phantom-like real-time updates
 * Provides real-time balance updates via Solana's WebSocket API
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getRpcUrl } from './rpcFailover';

type BalanceCallback = (balance: number) => void;
type TokenBalanceCallback = (mint: string, balance: number) => void;

interface Subscription {
  id: number;
  callback: BalanceCallback | TokenBalanceCallback;
  address: string;
}

class SolanaWebSocketService {
  private connection: Connection | null = null;
  private subscriptions = new Map<string, Subscription>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isConnected = false;

  // Event listeners
  private onConnectCallbacks: (() => void)[] = [];
  private onDisconnectCallbacks: (() => void)[] = [];

  constructor() {
    console.log('[SolanaWS] WebSocket service created');
  }

  /**
   * Initialize WebSocket connection
   */
  connect(network: 'solana-mainnet' | 'solana-devnet' = 'solana-mainnet'): void {
    try {
      const rpcUrl = getRpcUrl(network);
      // Convert HTTPS to WSS for WebSocket connection
      const wsUrl = rpcUrl
        .replace('https://', 'wss://')
        .replace('http://', 'ws://');

      console.log(`[SolanaWS] Connecting to ${network}...`);

      this.connection = new Connection(rpcUrl, {
        commitment: 'confirmed',
        wsEndpoint: wsUrl,
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log('[SolanaWS] Connected successfully');
      this.onConnectCallbacks.forEach((cb) => cb());
    } catch (error) {
      console.error('[SolanaWS] Connection error:', error);
      this.handleDisconnect();
    }
  }

  /**
   * Subscribe to SOL balance changes for an address
   */
  subscribeToBalance(address: string, callback: BalanceCallback): () => void {
    if (!this.connection) {
      console.warn('[SolanaWS] Not connected, connecting now...');
      this.connect();
    }

    const key = `balance:${address}`;

    // Avoid duplicate subscriptions
    if (this.subscriptions.has(key)) {
      console.log(`[SolanaWS] Already subscribed to ${address}`);
      const existing = this.subscriptions.get(key)!;
      return () => this.unsubscribe(key, existing.id);
    }

    try {
      const pubkey = new PublicKey(address);
      const subscriptionId = this.connection!.onAccountChange(
        pubkey,
        (accountInfo) => {
          const balance = accountInfo.lamports / 1e9; // Convert lamports to SOL
          console.log(`[SolanaWS] Balance update for ${address}: ${balance} SOL`);
          callback(balance);
        },
        'confirmed'
      );

      this.subscriptions.set(key, {
        id: subscriptionId,
        callback,
        address,
      });

      console.log(`[SolanaWS] Subscribed to balance for ${address}`);

      return () => this.unsubscribe(key, subscriptionId);
    } catch (error) {
      console.error('[SolanaWS] Subscribe error:', error);
      return () => {};
    }
  }

  /**
   * Subscribe to SPL token balance changes
   */
  subscribeToTokenBalance(
    walletAddress: string,
    mint: string,
    callback: TokenBalanceCallback
  ): () => void {
    if (!this.connection) {
      console.warn('[SolanaWS] Not connected, connecting now...');
      this.connect();
    }

    const key = `token:${walletAddress}:${mint}`;

    if (this.subscriptions.has(key)) {
      console.log(`[SolanaWS] Already subscribed to token ${mint}`);
      const existing = this.subscriptions.get(key)!;
      return () => this.unsubscribe(key, existing.id);
    }

    try {
      const walletPubkey = new PublicKey(walletAddress);
      const mintPubkey = new PublicKey(mint);

      // Get the associated token account
      const { PublicKey: PK } = require('@solana/web3.js');
      const TOKEN_PROGRAM_ID = new PK('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      const ASSOCIATED_TOKEN_PROGRAM_ID = new PK('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

      // Derive the associated token account address
      const [ata] = PK.findProgramAddressSync(
        [walletPubkey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const subscriptionId = this.connection!.onAccountChange(
        ata,
        (accountInfo) => {
          // Parse token account data
          if (accountInfo.data.length >= 72) {
            const amount = accountInfo.data.readBigUInt64LE(64);
            const balance = Number(amount); // Actual balance in smallest units
            console.log(`[SolanaWS] Token update for ${mint}: ${balance}`);
            callback(mint, balance);
          }
        },
        'confirmed'
      );

      this.subscriptions.set(key, {
        id: subscriptionId,
        callback,
        address: ata.toBase58(),
      });

      console.log(`[SolanaWS] Subscribed to token ${mint} for ${walletAddress}`);

      return () => this.unsubscribe(key, subscriptionId);
    } catch (error) {
      console.error('[SolanaWS] Token subscribe error:', error);
      return () => {};
    }
  }

  /**
   * Subscribe to all account changes (logs)
   */
  subscribeToLogs(address: string, callback: (log: string) => void): () => void {
    if (!this.connection) {
      this.connect();
    }

    const key = `logs:${address}`;

    if (this.subscriptions.has(key)) {
      const existing = this.subscriptions.get(key)!;
      return () => this.unsubscribe(key, existing.id);
    }

    try {
      const pubkey = new PublicKey(address);
      const subscriptionId = this.connection!.onLogs(
        pubkey,
        (logs) => {
          console.log(`[SolanaWS] Log for ${address}:`, logs.signature);
          callback(logs.signature);
        },
        'confirmed'
      );

      this.subscriptions.set(key, {
        id: subscriptionId,
        callback: callback as any,
        address,
      });

      return () => this.unsubscribe(key, subscriptionId);
    } catch (error) {
      console.error('[SolanaWS] Logs subscribe error:', error);
      return () => {};
    }
  }

  /**
   * Unsubscribe from a subscription
   */
  private unsubscribe(key: string, subscriptionId: number): void {
    try {
      if (this.connection) {
        this.connection.removeAccountChangeListener(subscriptionId);
      }
      this.subscriptions.delete(key);
      console.log(`[SolanaWS] Unsubscribed: ${key}`);
    } catch (error) {
      console.error('[SolanaWS] Unsubscribe error:', error);
    }
  }

  /**
   * Handle disconnection and reconnection
   */
  private handleDisconnect(): void {
    this.isConnected = false;
    this.onDisconnectCallbacks.forEach((cb) => cb());

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[SolanaWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect();
        // Resubscribe to all previous subscriptions
        this.resubscribeAll();
      }, delay);
    } else {
      console.error('[SolanaWS] Max reconnect attempts reached');
    }
  }

  /**
   * Resubscribe to all subscriptions after reconnect
   */
  private resubscribeAll(): void {
    const oldSubscriptions = new Map(this.subscriptions);
    this.subscriptions.clear();

    for (const [key, sub] of oldSubscriptions) {
      if (key.startsWith('balance:')) {
        this.subscribeToBalance(sub.address, sub.callback as BalanceCallback);
      }
      // Add other subscription types as needed
    }
  }

  /**
   * Add event listener for connection
   */
  onConnect(callback: () => void): void {
    this.onConnectCallbacks.push(callback);
  }

  /**
   * Add event listener for disconnection
   */
  onDisconnect(callback: () => void): void {
    this.onDisconnectCallbacks.push(callback);
  }

  /**
   * Check if connected
   */
  isConnectedToWs(): boolean {
    return this.isConnected;
  }

  /**
   * Get number of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    console.log('[SolanaWS] Disconnecting...');

    // Unsubscribe from all
    for (const [key, sub] of this.subscriptions) {
      try {
        if (this.connection) {
          this.connection.removeAccountChangeListener(sub.id);
        }
      } catch {
        // Ignore errors during cleanup
      }
    }

    this.subscriptions.clear();
    this.connection = null;
    this.isConnected = false;

    console.log('[SolanaWS] Disconnected');
  }
}

// Singleton instance
export const solanaWebSocket = new SolanaWebSocketService();

// Convenience exports
export const connectWs = solanaWebSocket.connect.bind(solanaWebSocket);
export const subscribeToBalance = solanaWebSocket.subscribeToBalance.bind(solanaWebSocket);
export const subscribeToTokenBalance = solanaWebSocket.subscribeToTokenBalance.bind(solanaWebSocket);
export const subscribeToLogs = solanaWebSocket.subscribeToLogs.bind(solanaWebSocket);
export const disconnectWs = solanaWebSocket.disconnect.bind(solanaWebSocket);
export const isWsConnected = solanaWebSocket.isConnectedToWs.bind(solanaWebSocket);

console.log('[SolanaWebSocket] Service initialized');
