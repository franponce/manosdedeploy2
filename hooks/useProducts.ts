import useSWR from 'swr';
import { Product } from '@/product/types';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Error al cargar los productos');
  }
  return response.json();
};

export function useProducts(forStore: boolean = false) {
  const { 
    data: products, 
    error, 
    isLoading,
    mutate 
  } = useSWR<Product[]>(`/api/products${forStore ? '?store=true' : ''}`, fetcher);

  const updateProductVisibility = async (product: Product, isVisible: boolean) => {
    try {
      await fetch(`/api/products/${product.id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible })
      });

      mutate();
    } catch (error) {
      mutate();
      throw error;
    }
  };

  return {
    products,
    isLoading,
    error,
    updateProductVisibility
  };
} 