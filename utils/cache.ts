export class Cache {
  private static instance: Cache | null = null;
  private cache: Map<string, any>;
  private timestamps: Map<string, number>;

  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  public async get<T>(key: string, allowExpired: boolean = false): Promise<T | null> {
    const value = this.cache.get(key);
    const timestamp = this.timestamps.get(key);

    if (!value || !timestamp) return null;

    if (allowExpired || timestamp > Date.now()) {
      return value as T;
    }

    this.delete(key);
    return null;
  }

  public async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now() + (ttl * 1000));
  }

  public delete(key: string): void {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  public clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  public keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export const cacheInstance = Cache.getInstance();