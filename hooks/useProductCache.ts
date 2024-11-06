import { useCache } from './useCache';
import { CACHE_KEYS, CACHE_CONFIG } from '../utils/cache/config';
import { Product } from '../product/types';

export function useProductsCache() {
  return useCache<Product[]>(
    CACHE_KEYS.PRODUCTS,
    async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Error fetching products');
      return response.json();
    },
    {
      ttl: CACHE_CONFIG.TTL.PRODUCTS,
      refreshInterval: CACHE_CONFIG.REVALIDATION.INTERVAL.PRODUCTS,
    }
  );
}

export function useProductStock(productId: string) {
  return useCache<number>(
    CACHE_KEYS.STOCK(productId),
    async () => {
      const response = await fetch(`/api/products/${productId}/stock`);
      if (!response.ok) throw new Error('Error fetching stock');
      const data = await response.json();
      return data.stock;
    },
    {
      ttl: CACHE_CONFIG.TTL.STOCK,
      refreshInterval: CACHE_CONFIG.REVALIDATION.INTERVAL.STOCK,
    }
  );
} 