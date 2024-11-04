import { cacheInstance } from './cache';

export const CacheManager = {
  async invalidateProducts(): Promise<void> {
    const keys = await cacheInstance.keys();
    const productKeys = keys.filter(key => key.startsWith('products:'));
    await Promise.all(productKeys.map(key => cacheInstance.delete(key)));
  },

  async invalidateProduct(productId: string): Promise<void> {
    await cacheInstance.delete(`products:${productId}`);
  },

  async invalidateCategory(categoryId: string): Promise<void> {
    await cacheInstance.delete(`products:category:${categoryId}`);
  },

  async invalidateAll(): Promise<void> {
    await cacheInstance.clear();
  }
};

export type { CacheManager as CacheManagerType }; 