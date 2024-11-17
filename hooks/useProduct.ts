import { Product } from '../product/types';
import useSWR from 'swr';

export const useProduct = (id: string) => {
  const { data, error } = useSWR<Product>(
    id ? `/api/products/${id}` : null
  );

  return {
    product: data ? {
      ...data,
      images: Array.isArray(data.images) ? data.images : []
    } : undefined,
    isLoading: !error && !data,
    error
  };
}; 