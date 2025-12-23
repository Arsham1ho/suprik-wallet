/**
 * Request Deduplication System - Phantom-like optimization
 * Prevents duplicate API calls for the same data within a time window
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private cache = new Map<string, CacheEntry<any>>();

  // Default TTL for cached data (in milliseconds)
  private defaultCacheTTL = 30000; // 30 seconds

  // Time window for deduplication (in milliseconds)
  private deduplicationWindow = 5000; // 5 seconds

  /**
   * Execute a request with deduplication
   * If the same request is already pending, return the pending promise
   * If cached data exists and is fresh, return cached data
   */
  async dedupe<T>(
    key: string,
    requestFn: () => Promise<T>,
    options?: {
      cacheTTL?: number;
      forceRefresh?: boolean;
    }
  ): Promise<T> {
    const cacheTTL = options?.cacheTTL ?? this.defaultCacheTTL;
    const forceRefresh = options?.forceRefresh ?? false;
    const now = Date.now();

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.cache.get(key);
      if (cached && now - cached.timestamp < cacheTTL) {
        console.log(`[Dedup] Cache hit for ${key}`);
        return cached.data;
      }
    }

    // Check for pending request
    const pending = this.pendingRequests.get(key);
    if (pending && now - pending.timestamp < this.deduplicationWindow) {
      console.log(`[Dedup] Reusing pending request for ${key}`);
      return pending.promise;
    }

    // Create new request
    console.log(`[Dedup] New request for ${key}`);
    const promise = requestFn()
      .then((data) => {
        // Cache the result
        this.cache.set(key, { data, timestamp: Date.now() });
        // Clean up pending request
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        // Clean up pending request on error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store as pending
    this.pendingRequests.set(key, { promise, timestamp: now });

    return promise;
  }

  /**
   * Batch multiple requests together
   * Useful for fetching multiple token prices at once
   */
  async batchDedupe<T>(
    keyPrefix: string,
    items: string[],
    batchFn: (items: string[]) => Promise<Map<string, T>>,
    options?: {
      cacheTTL?: number;
      maxBatchSize?: number;
    }
  ): Promise<Map<string, T>> {
    const cacheTTL = options?.cacheTTL ?? this.defaultCacheTTL;
    const maxBatchSize = options?.maxBatchSize ?? 100;
    const now = Date.now();

    const results = new Map<string, T>();
    const itemsToFetch: string[] = [];

    // Check cache for each item
    for (const item of items) {
      const key = `${keyPrefix}:${item}`;
      const cached = this.cache.get(key);
      if (cached && now - cached.timestamp < cacheTTL) {
        results.set(item, cached.data);
      } else {
        itemsToFetch.push(item);
      }
    }

    console.log(`[Dedup] Batch ${keyPrefix}: ${items.length - itemsToFetch.length} cached, ${itemsToFetch.length} to fetch`);

    // Fetch remaining items in batches
    if (itemsToFetch.length > 0) {
      for (let i = 0; i < itemsToFetch.length; i += maxBatchSize) {
        const batch = itemsToFetch.slice(i, i + maxBatchSize);
        const batchKey = `${keyPrefix}:batch:${batch.join(',')}`;

        const batchResults = await this.dedupe(batchKey, () => batchFn(batch), { cacheTTL });

        // Cache individual results
        batchResults.forEach((value, key) => {
          this.cache.set(`${keyPrefix}:${key}`, { data: value, timestamp: Date.now() });
          results.set(key, value);
        });
      }
    }

    return results;
  }

  /**
   * Invalidate cache for a specific key or pattern
   */
  invalidate(keyOrPattern: string | RegExp): void {
    if (typeof keyOrPattern === 'string') {
      this.cache.delete(keyOrPattern);
      this.pendingRequests.delete(keyOrPattern);
    } else {
      // Pattern matching
      for (const key of this.cache.keys()) {
        if (keyOrPattern.test(key)) {
          this.cache.delete(key);
        }
      }
      for (const key of this.pendingRequests.keys()) {
        if (keyOrPattern.test(key)) {
          this.pendingRequests.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('[Dedup] Cache cleared');
  }

  /**
   * Get cache stats
   */
  getStats(): { cacheSize: number; pendingRequests: number } {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
    };
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator();

// Convenience functions
export const dedupe = requestDeduplicator.dedupe.bind(requestDeduplicator);
export const batchDedupe = requestDeduplicator.batchDedupe.bind(requestDeduplicator);
export const invalidateCache = requestDeduplicator.invalidate.bind(requestDeduplicator);
export const clearCache = requestDeduplicator.clearAll.bind(requestDeduplicator);
export const getCacheStats = requestDeduplicator.getStats.bind(requestDeduplicator);

console.log('[RequestDeduplication] Initialized');
