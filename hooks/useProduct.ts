import useSWR from 'swr';
import { Product } from '../product/types';
import { SWR_KEYS } from '../product/constants';
import { stockService } from '../utils/firebase';

interface UseProductReturn {
  product: Product | undefined;
  isLoading: boolean;
  error: boolean;
  available: number;
}

export function useProduct(productId: string | null): UseProductReturn {
  const { data: products, error: fetchError, isLoading: productsLoading } = useSWR<Product[]>(
    SWR_KEYS.PRODUCTS
  );
  
  const { data: stockData, isLoading: stockLoading } = useSWR(
    productId ? `stock/${productId}` : null,
    () => stockService.getAvailableStock(productId!)
  );

  const product = products?.find(p => p.id === productId);
  const error = Boolean(fetchError) || (!productsLoading && !product);
  const isLoading = productsLoading || stockLoading;
  
  return {
    product,
    isLoading,
    error,
    available: stockData ?? 0
  };
} 