import { useMemo } from 'react';
import useSWR from 'swr';
import { Product } from '../product/types';
import { fetcher } from '../utils/fetcher';
import { useProductOrder } from './useProductOrder';
import { sortProducts } from '../utils/productSort';

export function useProducts() {
  const { data: products, ...rest } = useSWR<Product[]>('/api/products', fetcher);
  const { productOrders, orderSettings } = useProductOrder();

  const sortedProducts = useMemo(() => {
    if (!products || !productOrders || !orderSettings) return products || [];
    return sortProducts(products, productOrders, orderSettings);
  }, [products, productOrders, orderSettings]);

  return {
    products: sortedProducts,
    ...rest
  };
} 