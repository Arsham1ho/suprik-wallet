/**
 * Smart Balance Polling - Phantom-like optimization
 * Only polls the active chain to reduce API calls
 */

import { dedupe } from './requestDeduplication';

type Network = 'solana' | 'ethereum' | 'bitcoin' | 'polygon' | 'base';

interface PollingConfig {
  interval: number; // Polling interval in ms
  enabled: boolean;
}

interface BalanceFetcher {
  (address: string): Promise<number>;
}

class SmartPollingService {
  private activeNetwork: Network = 'solana';
  private pollingIntervals = new Map<Network, NodeJS.Timer>();
  private fetchers = new Map<Network, BalanceFetcher>();
  private addresses = new Map<Network, string>();
  private callbacks = new Map<Network, ((balance: number) => void)[]>();

  // Polling configuration per network
  private config: Record<Network, PollingConfig> = {
    solana: { interval: 10000, enabled: true }, // 10 seconds for Solana (fast finality)
    ethereum: { interval: 30000, enabled: true }, // 30 seconds for Ethereum
    bitcoin: { interval: 60000, enabled: true }, // 60 seconds for Bitcoin (slow blocks)
    polygon: { interval: 15000, enabled: true }, // 15 seconds for Polygon
    base: { interval: 15000, enabled: true }, // 15 seconds for Base
  };

  // Background polling intervals (when not active)
  private backgroundIntervals: Record<Network, number> = {
    solana: 60000, // 1 minute
    ethereum: 120000, // 2 minutes
    bitcoin: 300000, // 5 minutes
    polygon: 120000, // 2 minutes
    base: 120000, // 2 minutes
  };

  constructor() {
    console.log('[SmartPolling] Service created');
  }

  /**
   * Register a balance fetcher for a network
   */
  registerFetcher(network: Network, fetcher: BalanceFetcher): void {
    this.fetchers.set(network, fetcher);
    console.log(`[SmartPolling] Registered fetcher for ${network}`);
  }

  /**
   * Set the address to poll for a network
   */
  setAddress(network: Network, address: string): void {
    this.addresses.set(network, address);
    console.log(`[SmartPolling] Set address for ${network}: ${address.slice(0, 8)}...`);
  }

  /**
   * Subscribe to balance updates for a network
   */
  subscribe(network: Network, callback: (balance: number) => void): () => void {
    const callbacks = this.callbacks.get(network) || [];
    callbacks.push(callback);
    this.callbacks.set(network, callbacks);

    console.log(`[SmartPolling] Subscribed to ${network} updates`);

    return () => {
      const cbs = this.callbacks.get(network) || [];
      const index = cbs.indexOf(callback);
      if (index > -1) {
        cbs.splice(index, 1);
        this.callbacks.set(network, cbs);
      }
    };
  }

  /**
   * Set the active network (this one gets faster polling)
   */
  setActiveNetwork(network: Network): void {
    if (this.activeNetwork !== network) {
      console.log(`[SmartPolling] Switching active network from ${this.activeNetwork} to ${network}`);
      this.activeNetwork = network;
      this.updatePollingIntervals();
    }
  }

  /**
   * Get the active network
   */
  getActiveNetwork(): Network {
    return this.activeNetwork;
  }

  /**
   * Start polling for all networks
   */
  start(): void {
    console.log('[SmartPolling] Starting polling service');
    this.updatePollingIntervals();
  }

  /**
   * Stop all polling
   */
  stop(): void {
    console.log('[SmartPolling] Stopping polling service');
    for (const [network, interval] of this.pollingIntervals) {
      clearInterval(interval);
    }
    this.pollingIntervals.clear();
  }

  /**
   * Update polling intervals based on active network
   */
  private updatePollingIntervals(): void {
    // Clear existing intervals
    for (const [network, interval] of this.pollingIntervals) {
      clearInterval(interval);
    }
    this.pollingIntervals.clear();

    // Set up new intervals
    for (const network of ['solana', 'ethereum', 'bitcoin', 'polygon', 'base'] as Network[]) {
      const config = this.config[network];
      if (!config.enabled) continue;

      // Use faster interval for active network, slower for background
      const interval = network === this.activeNetwork
        ? config.interval
        : this.backgroundIntervals[network];

      const timer = setInterval(() => {
        this.pollNetwork(network);
      }, interval);

      this.pollingIntervals.set(network, timer);

      console.log(`[SmartPolling] ${network} polling every ${interval / 1000}s (${network === this.activeNetwork ? 'active' : 'background'})`);
    }

    // Immediately poll the active network
    this.pollNetwork(this.activeNetwork);
  }

  /**
   * Poll a specific network for balance
   */
  private async pollNetwork(network: Network): Promise<void> {
    const fetcher = this.fetchers.get(network);
    const address = this.addresses.get(network);
    const callbacks = this.callbacks.get(network) || [];

    if (!fetcher || !address) {
      return;
    }

    try {
      // Use deduplication to prevent duplicate requests
      const balance = await dedupe(
        `balance:${network}:${address}`,
        () => fetcher(address),
        { cacheTTL: network === this.activeNetwork ? 5000 : 30000 }
      );

      // Notify subscribers
      callbacks.forEach((cb) => {
        try {
          cb(balance);
        } catch (e) {
          console.error(`[SmartPolling] Callback error for ${network}:`, e);
        }
      });
    } catch (error) {
      console.error(`[SmartPolling] Error polling ${network}:`, error);
    }
  }

  /**
   * Force an immediate poll for a network
   */
  async forcePoll(network: Network): Promise<number | null> {
    const fetcher = this.fetchers.get(network);
    const address = this.addresses.get(network);

    if (!fetcher || !address) {
      return null;
    }

    try {
      return await dedupe(
        `balance:${network}:${address}`,
        () => fetcher(address),
        { forceRefresh: true }
      );
    } catch (error) {
      console.error(`[SmartPolling] Force poll error for ${network}:`, error);
      return null;
    }
  }

  /**
   * Enable/disable polling for a network
   */
  setNetworkEnabled(network: Network, enabled: boolean): void {
    this.config[network].enabled = enabled;
    this.updatePollingIntervals();
  }

  /**
   * Set custom polling interval for a network
   */
  setPollingInterval(network: Network, interval: number): void {
    this.config[network].interval = interval;
    this.updatePollingIntervals();
  }

  /**
   * Get polling stats
   */
  getStats(): Record<Network, { active: boolean; interval: number }> {
    const stats: Record<Network, { active: boolean; interval: number }> = {} as any;

    for (const network of ['solana', 'ethereum', 'bitcoin', 'polygon', 'base'] as Network[]) {
      const isActive = network === this.activeNetwork;
      stats[network] = {
        active: isActive,
        interval: isActive
          ? this.config[network].interval
          : this.backgroundIntervals[network],
      };
    }

    return stats;
  }
}

// Singleton instance
export const smartPolling = new SmartPollingService();

// Convenience exports
export const registerFetcher = smartPolling.registerFetcher.bind(smartPolling);
export const setPollingAddress = smartPolling.setAddress.bind(smartPolling);
export const subscribeToPolling = smartPolling.subscribe.bind(smartPolling);
export const setActiveNetwork = smartPolling.setActiveNetwork.bind(smartPolling);
export const getActiveNetwork = smartPolling.getActiveNetwork.bind(smartPolling);
export const startPolling = smartPolling.start.bind(smartPolling);
export const stopPolling = smartPolling.stop.bind(smartPolling);
export const forcePoll = smartPolling.forcePoll.bind(smartPolling);
export const getPollingStats = smartPolling.getStats.bind(smartPolling);

console.log('[SmartPolling] Service initialized');
