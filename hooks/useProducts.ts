import useSWR from 'swr';
import { Product } from '../product/types';

export function useProducts(initialData?: Product[]) {
  const { data: products, error, mutate } = useSWR<Product[]>(
    '/api/products',
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    },
    {
      fallbackData: initialData,
      refreshInterval: 30000, // Revalidar cada 30 segundos
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  const revalidateProducts = async () => {
    await mutate();
  };

  return {
    products,
    isLoading: !error && !products,
    isError: error,
    revalidateProducts,
  };
} 