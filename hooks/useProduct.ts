import useSWR from 'swr';
import { Product } from '../product/types';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Error al cargar el producto');
  }
  return response.json();
};

export function useProduct(id: string | undefined) {
  const { data: product, error, isLoading } = useSWR<Product>(
    id ? `/api/products/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    }
  );

  return {
    product,
    isLoading,
    error
  };
} 