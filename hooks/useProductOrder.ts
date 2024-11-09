import useSWR from 'swr';
import { ProductOrder, ProductOrderSettings } from '../product/types';
import { fetcher } from '../utils/fetcher';

export function useProductOrder() {
  const { data: orderSettings, mutate: mutateSettings } = useSWR<ProductOrderSettings>(
    '/api/product-order/settings',
    fetcher
  );

  const { data: productOrders, mutate: mutateOrders } = useSWR<ProductOrder[]>(
    '/api/product-order',
    fetcher
  );

  const updateProductOrder = async (updates: Partial<ProductOrder>[]) => {
    try {
      const response = await fetch('/api/product-order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el orden');
      }

      await mutateOrders();
      return await response.json();
    } catch (error) {
      console.error('Error updating product order:', error);
      throw error;
    }
  };

  return {
    orderSettings,
    productOrders,
    updateProductOrder,
    mutateSettings
  };
} 