/**
 * RPC Failover System - Phantom-like reliability
 * Automatically switches between RPC providers when one fails
 */

import { Connection } from '@solana/web3.js';
import { getHeliusApiKey } from './env';

interface RPCProvider {
  name: string;
  getUrl: () => string; // Function to get URL (allows dynamic API key lookup)
  priority: number; // Lower = higher priority
  isHealthy: boolean;
  lastError?: Date;
  errorCount: number;
}

interface RPCProviderConfig {
  name: string;
  getUrl: () => string;
  priority: number;
}

// Solana RPC providers (in priority order)
// URLs are generated dynamically to use current API key from encrypted storage
function getSolanaMainnetProviders(): RPCProviderConfig[] {
  return [
    // Primary: Helius (if API key available, skip if no key)
    ...(getHeliusApiKey()
      ? [
          {
            name: 'Helius',
            getUrl: () => `https://mainnet.helius-rpc.com/?api-key=${getHeliusApiKey()}`,
            priority: 1,
          },
        ]
      : []),
    // Secondary: PublicNode (free, CORS-friendly, reliable)
    {
      name: 'PublicNode',
      getUrl: () => 'https://solana-rpc.publicnode.com',
      priority: 2,
    },
    // Tertiary: Solana public RPC (may block CORS from localhost)
    {
      name: 'Solana Mainnet',
      getUrl: () => 'https://api.mainnet-beta.solana.com',
      priority: 3,
    },
  ];
}

// Solana Devnet providers
function getSolanaDevnetProviders(): RPCProviderConfig[] {
  return [
    {
      name: 'Solana Devnet',
      getUrl: () => 'https://api.devnet.solana.com',
      priority: 1,
    },
    {
      name: 'Helius Devnet',
      getUrl: () => {
        const apiKey = getHeliusApiKey();
        return apiKey
          ? `https://devnet.helius-rpc.com/?api-key=${apiKey}`
          : 'https://api.devnet.solana.com'; // Fallback if no key
      },
      priority: 2,
    },
  ];
}

class RPCFailoverManager {
  private providers: Map<string, RPCProvider[]> = new Map();
  private connections: Map<string, Connection> = new Map();
  private healthCheckInterval?: ReturnType<typeof setInterval>;

  // Error threshold before marking provider as unhealthy
  private errorThreshold = 3;
  // Cooldown before retrying unhealthy provider (5 minutes)
  private cooldownMs = 5 * 60 * 1000;

  constructor() {
    this.initializeProviders();
    this.startHealthCheck();
  }

  private initializeProviders() {
    // Initialize Solana mainnet providers
    this.providers.set(
      'solana-mainnet',
      getSolanaMainnetProviders().map((p) => ({
        ...p,
        isHealthy: true,
        errorCount: 0,
      }))
    );

    // Initialize Solana devnet providers
    this.providers.set(
      'solana-devnet',
      getSolanaDevnetProviders().map((p) => ({
        ...p,
        isHealthy: true,
        errorCount: 0,
      }))
    );
  }

  /**
   * Get the best available RPC connection for a network
   */
  getConnection(network: 'solana-mainnet' | 'solana-devnet' = 'solana-mainnet'): Connection {
    const providers = this.providers.get(network);
    if (!providers || providers.length === 0) {
      throw new Error(`No RPC providers available for ${network}`);
    }

    // Sort by priority and health
    const sortedProviders = [...providers].sort((a, b) => {
      // Healthy providers first
      if (a.isHealthy !== b.isHealthy) {
        return a.isHealthy ? -1 : 1;
      }
      // Then by priority
      return a.priority - b.priority;
    });

    const bestProvider = sortedProviders[0];
    const url = bestProvider.getUrl();
    const connectionKey = `${network}:${bestProvider.name}`;

    // Reuse existing connection if available
    if (!this.connections.has(connectionKey)) {
      this.connections.set(
        connectionKey,
        new Connection(url, {
          commitment: 'confirmed',
          confirmTransactionInitialTimeout: 60000,
        })
      );
    }

    return this.connections.get(connectionKey)!;
  }

  /**
   * Get the RPC URL for a network
   */
  getRpcUrl(network: 'solana-mainnet' | 'solana-devnet' = 'solana-mainnet'): string {
    const providers = this.providers.get(network);
    if (!providers || providers.length === 0) {
      throw new Error(`No RPC providers available for ${network}`);
    }

    const healthyProviders = providers
      .filter((p) => p.isHealthy)
      .sort((a, b) => a.priority - b.priority);

    if (healthyProviders.length === 0) {
      // All providers unhealthy, use first one anyway
      return providers[0].getUrl();
    }

    return healthyProviders[0].getUrl();
  }

  /**
   * Report an error for a provider by name
   */
  reportError(providerName: string, network: string): void {
    const providers = this.providers.get(network);
    if (!providers) return;

    const provider = providers.find((p) => p.name === providerName);
    if (provider) {
      provider.errorCount++;
      provider.lastError = new Date();

      if (provider.errorCount >= this.errorThreshold) {
        provider.isHealthy = false;
        // Clear cached connection
        const connectionKey = `${network}:${providerName}`;
        this.connections.delete(connectionKey);
      }
    }
  }

  /**
   * Report a successful request for a provider
   */
  reportSuccess(providerName: string): void {
    for (const providers of this.providers.values()) {
      const provider = providers.find((p) => p.name === providerName);
      if (provider) {
        // Reset error count on success
        provider.errorCount = 0;
        provider.isHealthy = true;
        break;
      }
    }
  }

  /**
   * Execute a request with automatic failover
   */
  async executeWithFailover<T>(
    network: 'solana-mainnet' | 'solana-devnet',
    requestFn: (connection: Connection) => Promise<T>
  ): Promise<T> {
    const providers = this.providers.get(network);
    if (!providers || providers.length === 0) {
      throw new Error(`No RPC providers available for ${network}`);
    }

    // Sort providers by health and priority
    const sortedProviders = [...providers]
      .filter((p) => p.isHealthy || this.shouldRetry(p))
      .sort((a, b) => {
        if (a.isHealthy !== b.isHealthy) return a.isHealthy ? -1 : 1;
        return a.priority - b.priority;
      });

    let lastError: Error | null = null;

    for (const provider of sortedProviders) {
      try {
        const url = provider.getUrl();
        const connectionKey = `${network}:${provider.name}`;

        if (!this.connections.has(connectionKey)) {
          this.connections.set(
            connectionKey,
            new Connection(url, {
              commitment: 'confirmed',
              confirmTransactionInitialTimeout: 60000,
            })
          );
        }

        const connection = this.connections.get(connectionKey)!;
        const result = await requestFn(connection);

        // Success - report and return
        this.reportSuccess(provider.name);
        return result;
      } catch (error: any) {
        lastError = error;
        this.reportError(provider.name, network);
        // Silent failover - try next provider
      }
    }

    throw lastError || new Error('All RPC providers failed');
  }

  /**
   * Check if an unhealthy provider should be retried
   */
  private shouldRetry(provider: RPCProvider): boolean {
    if (provider.isHealthy) return true;
    if (!provider.lastError) return true;

    const timeSinceError = Date.now() - provider.lastError.getTime();
    return timeSinceError >= this.cooldownMs;
  }

  /**
   * Start periodic health checks
   */
  private startHealthCheck(): void {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, 30000);
  }

  /**
   * Check health of all providers
   */
  private async checkHealth(): Promise<void> {
    for (const [, providers] of this.providers) {
      for (const provider of providers) {
        if (!provider.isHealthy && this.shouldRetry(provider)) {
          try {
            const url = provider.getUrl();
            const connection = new Connection(url, { commitment: 'confirmed' });
            await connection.getSlot();
            provider.isHealthy = true;
            provider.errorCount = 0;
          } catch {
            // Still unhealthy
          }
        }
      }
    }
  }

  /**
   * Get status of all providers
   */
  getStatus(): Record<string, { name: string; healthy: boolean; errors: number }[]> {
    const status: Record<string, { name: string; healthy: boolean; errors: number }[]> = {};

    for (const [network, providers] of this.providers) {
      status[network] = providers.map((p) => ({
        name: p.name,
        healthy: p.isHealthy,
        errors: p.errorCount,
      }));
    }

    return status;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.connections.clear();
  }
}

// Singleton instance
export const rpcFailover = new RPCFailoverManager();

// Convenience exports
export const getConnection = rpcFailover.getConnection.bind(rpcFailover);
export const getRpcUrl = rpcFailover.getRpcUrl.bind(rpcFailover);
export const executeWithFailover = rpcFailover.executeWithFailover.bind(rpcFailover);
export const getRpcStatus = rpcFailover.getStatus.bind(rpcFailover);
