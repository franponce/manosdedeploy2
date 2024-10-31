import useSWR from 'swr';
import { Product } from '../product/types';

interface UseProductReturn {
  product: Product | null;
  isLoading: boolean;
  isError: boolean;
  mutate: () => void;
}

export const useProduct = (productId: string | undefined): UseProductReturn => {
  const {
    data: product,
    error,
    isLoading,
    mutate
  } = useSWR<Product>(
    productId ? `/api/products/${productId}` : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    product: product || null,
    isLoading,
    isError: !!error,
    mutate
  };
}; 