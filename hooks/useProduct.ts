import useSWR from 'swr';
import { Product } from '../product/types';
import { SWR_KEYS } from '../product/constants';
import { stockService } from '../utils/firebase';

interface UseProductReturn {
  product: Product | undefined;
  isLoading: boolean;
  error: boolean;
  stock: number;
}

export function useProduct(productId: string | null): UseProductReturn {
  const { data: products, error: fetchError, isLoading: productsLoading } = useSWR<Product[]>(
    SWR_KEYS.PRODUCTS
  );
  
  // Nuevo SWR para el stock en tiempo real
  const { data: stockData, isLoading: stockLoading } = useSWR(
    productId ? `stock/${productId}` : null,
    () => stockService.getProductStock(productId!)
  );

  const product = products?.find(p => p.id === productId);
  const error = Boolean(fetchError) || (!productsLoading && !product);
  const isLoading = productsLoading || stockLoading;
  
  // Calcular stock disponible considerando reservas
  const stock = stockData ?? 0;

  return {
    product,
    isLoading,
    error,
    stock
  };
} 