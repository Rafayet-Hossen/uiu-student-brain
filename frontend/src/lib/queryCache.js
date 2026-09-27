/**
 * High-Performance Resilient In-Memory SWR Cache for StudentBrain
 * Provides 0ms instant cached navigation, automatic background revalidation,
 * and resilient network retry with exponential backoff so data loading never fails.
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
    this.inFlight = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    return item;
  }

  set(key, data, ttlMs = 180000) {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  invalidate(pattern) {
    if (!pattern) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (typeof pattern === "string" && key.includes(pattern)) {
        this.store.delete(key);
      } else if (pattern instanceof RegExp && pattern.test(key)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Resilient Fetch with automatic retry and exponential backoff
   */
  async retryFetch(fetcherFn, retries = 2, delayMs = 350) {
    let lastError = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fetcherFn();
      } catch (err) {
        lastError = err;
        // Don't retry if client error (400, 401, 403, 404) unless it's a transient 408/429
        const status = err?.response?.status;
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
          throw err;
        }
        if (attempt < retries) {
          const backoff = delayMs * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }
    throw lastError;
  }

  /**
   * fetchWithSWR: Stale-While-Revalidate caching pattern
   * - Returns cached data immediately if available (0ms load).
   * - Revalidates in background and triggers onBackgroundUpdate callback.
   * - If not cached, fetches with resilient retries.
   */
  async fetchWithSWR(key, fetcherFn, options = {}) {
    const {
      ttl = 180000, // 3 minutes fresh
      staleTtl = 600000, // 10 minutes usable stale fallback
      retries = 2,
      onBackgroundUpdate = null,
      forceRefresh = false,
    } = options;

    const cached = this.get(key);
    const now = Date.now();

    // If we have cached data and not forced
    if (cached && !forceRefresh) {
      const age = now - cached.timestamp;
      const isFresh = age < ttl;
      const isUsableStale = age < staleTtl;

      // If fresh, return immediately
      if (isFresh) {
        return cached.data;
      }

      // If usable stale, trigger background revalidation and return cached data immediately!
      if (isUsableStale) {
        // Revalidate in background if not already in flight
        if (!this.inFlight.has(key)) {
          const promise = this.retryFetch(fetcherFn, retries)
            .then((freshData) => {
              this.set(key, freshData, ttl);
              if (typeof onBackgroundUpdate === "function") {
                onBackgroundUpdate(freshData);
              }
              return freshData;
            })
            .catch((err) => {
              console.warn(`[queryCache] Background revalidation failed for ${key}:`, err);
            })
            .finally(() => {
              this.inFlight.delete(key);
            });
          this.inFlight.set(key, promise);
        }
        return cached.data;
      }
    }

    // Deduplicate in-flight promises
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key);
    }

    const fetchPromise = this.retryFetch(fetcherFn, retries)
      .then((data) => {
        this.set(key, data, ttl);
        return data;
      })
      .catch((err) => {
        // Fallback to any stale cached data if network failed completely
        if (cached?.data) {
          console.warn(`[queryCache] Request failed for ${key}, falling back to cached state.`, err);
          return cached.data;
        }
        throw err;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, fetchPromise);
    return fetchPromise;
  }
}

export const queryCache = new MemoryCache();
export default queryCache;
