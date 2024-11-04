type CacheData = {
  value: any;
  timestamp: number;
};

class Cache {
  private cache: Map<string, CacheData>;

  constructor() {
    this.cache = new Map();
  }

  async get(key: string): Promise<any | null> {
    const data = this.cache.get(key);
    if (!data) return null;

    // Verificar si el cache expiró (5 minutos)
    if (Date.now() - data.timestamp > 5 * 60 * 1000) {
      this.cache.delete(key);
      return null;
    }

    return data.value;
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

export const cache = new Cache(); 