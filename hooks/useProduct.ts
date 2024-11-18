import useSWR from 'swr';
import { Product } from '../product/types';
import { SWR_KEYS } from '../product/constants';

interface UseProductReturn {
  product: Product | undefined;
  isLoading: boolean;
  error: boolean;
  stock: number;
}

export function useProduct(productId: string | null): UseProductReturn {
  const { data: products, error: fetchError, isLoading } = useSWR<Product[]>(
    SWR_KEYS.PRODUCTS
  );

  const product = products?.find(p => p.id === productId);
  const error = Boolean(fetchError) || (!isLoading && !product);
  const stock = product?.stock ?? 0;

  return {
    product,
    isLoading,
    error,
    stock
  };
} 