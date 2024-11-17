import { Product } from '../product/types';
import useSWR from 'swr';

export const useProduct = (id: string | null) => {
  const { data, error } = useSWR<Product>(
    id ? `/api/products/${id}` : null,
    async (url: string | URL | Request) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }
      const data = await response.json();
      return {
        ...data,
        images: Array.isArray(data.images) ? data.images : []
      };
    }
  );

  return {
    product: data,
    isLoading: id && !error && !data,
    error
  };
}; 