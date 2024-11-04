import { Product } from "@/product/types";

import { useCache } from "./useCache";

export function useProducts(config?: { forceValidate?: boolean }) {
  return useCache<Product[]>(
    'products',
    async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Error fetching products');
      return response.json();
    },
    {
      ttl: 300,
      forceValidate: config?.forceValidate,
    }
  );
}

export function useProductStock(productId: string) {
  return useCache<number>(
    `product:${productId}:stock`,
    async () => {
      const response = await fetch(`/api/products/${productId}/stock`);
      if (!response.ok) throw new Error('Error fetching stock');
      return response.json();
    },
    {
      ttl: 300,
      revalidateOnFocus: false,
    }
  );
} 