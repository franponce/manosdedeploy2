import { useCache } from './useCache';
import { Product } from '../product/types';

const CACHE_KEYS = {
  ALL_PRODUCTS: 'products:all',
  PRODUCT: (id: string) => `products:${id}`,
  CATEGORY_PRODUCTS: (categoryId: string) => `products:category:${categoryId}`,
};

export function useProductsWithCache(config?: { 
  categoryId?: string, 
  forceValidate?: boolean 
}) {
  const cacheKey = config?.categoryId 
    ? CACHE_KEYS.CATEGORY_PRODUCTS(config.categoryId)
    : CACHE_KEYS.ALL_PRODUCTS;

  return useCache<Product[]>(
    cacheKey,
    async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Error fetching products');
      const products = await response.json();
      
      if (config?.categoryId) {
        return products.filter(
          (product: Product) => product.categoryId === config.categoryId
        );
      }
      
      return products;
    },
    {
      ttl: 300, // 5 minutos
      forceValidate: config?.forceValidate,
      revalidateOnFocus: false,
      revalidateIfStale: true,
    }
  );
}

export function useProductStock(productId: string) {
  return useCache<{ stock: number }>(
    CACHE_KEYS.PRODUCT(productId),
    async () => {
      const response = await fetch(`/api/products/${productId}/stock`);
      if (!response.ok) throw new Error('Error fetching stock');
      return response.json();
    },
    {
      ttl: 60, // 1 minuto para el stock
      revalidateOnFocus: true,
      refreshInterval: 60000, // Actualizar cada minuto
    }
  );
} 