import { Product } from '../product/types';
import useSWR, { SWRConfiguration } from 'swr';

const fetcher = async (url: string) => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Error al cargar el producto');
    }

    const data = await response.json();
    return {
      ...data,
      images: Array.isArray(data.images) ? data.images.filter(Boolean) : 
              typeof data.image === 'string' ? [data.image] : []
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const useProduct = (id: string | null) => {
  const config: SWRConfiguration = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    errorRetryCount: 3
  };

  const { data, error } = useSWR<Product>(
    id ? `/api/products/${id}` : null,
    fetcher,
    config
  );

  return {
    product: data,
    isLoading: id && !error && !data,
    error
  };
}; 