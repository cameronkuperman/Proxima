class AICache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 30 * 60 * 1000; // 30 minutes default

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < (ttl || this.TTL)) {
      return cached.data as T;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: now });
      return data;
    } catch (error) {
      // If fetch fails but we have stale data, return it
      if (cached) {
        console.warn('Using stale cache due to fetch error:', error);
        return cached.data as T;
      }
      throw error;
    }
  }

  invalidate(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Get cache stats for debugging
  getStats() {
    const now = Date.now();
    const stats = {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      items: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        age: now - value.timestamp,
        expired: now - value.timestamp > this.TTL
      }))
    };
    return stats;
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}

export const aiCache = new AICache();

// Optional: Set up periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    aiCache.cleanup();
  }, 5 * 60 * 1000); // Clean up every 5 minutes
}