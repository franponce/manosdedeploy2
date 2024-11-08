import useSWR from 'swr';
import { Product } from '../product/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useProduct(id: string | undefined) {
  const { data: product, error, isLoading } = useSWR<Product>(
    id ? `/api/products/${id}` : null,
    fetcher
  );

  return {
    product,
    isLoading,
    error
  };
} 