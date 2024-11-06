import { cacheInstance } from './instance';
import { CACHE_KEYS, CACHE_CONFIG } from './config';

export class CacheManager {
  static async invalidateProducts(): Promise<void> {
    const keys = await cacheInstance.keys();
    const productKeys = keys.filter(key => 
      key.startsWith(CACHE_KEYS.PRODUCTS)
    );
    await Promise.all(productKeys.map(key => 
      cacheInstance.delete(key)
    ));
  }

  static async invalidateStock(productId: string): Promise<void> {
    await cacheInstance.delete(CACHE_KEYS.STOCK(productId));
  }

  static async invalidateCategory(categoryId: string): Promise<void> {
    await cacheInstance.delete(`${CACHE_KEYS.CATEGORIES}:${categoryId}`);
  }

  static async invalidateAll(): Promise<void> {
    await cacheInstance.clear();
  }
} 