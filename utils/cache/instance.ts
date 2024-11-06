class Cache {
  private static instance: Cache;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  async set(key: string, data: any, ttl: number): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }
}

export const cacheInstance = Cache.getInstance(); 