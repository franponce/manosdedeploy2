import useSWR from 'swr';
import { Product } from '../product/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useProducts() {
  const { data: products, error, mutate } = useSWR<Product[]>('/api/products', fetcher);

  return {
    products: products || [],
    isLoading: !error && !products,
    isError: error,
    mutate
  };
} 