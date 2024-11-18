import useSWR from 'swr';
import { Product } from '../product/types';
import { SWR_KEYS } from '../product/constants';

export function useProduct(productId: string | null) {
  const { data: products } = useSWR<Product[]>(SWR_KEYS.PRODUCTS);
  
  const product = products?.find(p => p.id === productId);
  
  return {
    product,
    isLoading: !products,
    stock: product?.stock ?? 0
  };
} 