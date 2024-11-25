import useSWR from 'swr';
import { Product } from '../product/types';
import { SWR_KEYS } from '../product/constants';

const fetcher = async (url: string) => {
  try {
    // Intentar obtener del cache local
    const cachedData = localStorage.getItem(url);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      // Cache válido por 5 minutos
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return data;
      }
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Error al cargar productos');
    }
    const data = await response.json();
    
    // Guardar en cache local
    localStorage.setItem(url, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    // Si hay error, intentar usar cache aunque haya expirado
    const cachedData = localStorage.getItem(url);
    if (cachedData) {
      const { data } = JSON.parse(cachedData);
      return data;
    }
    throw error;
  }
};

export function useProducts() {
  const { data: products, error, isLoading } = useSWR<Product[]>(
    SWR_KEYS.PRODUCTS,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutos
      errorRetryCount: 3
    }
  );

  return {
    products,
    isLoading,
    error
  };
}

export function useProduct(productId: string | null) {
  const { products, error, isLoading } = useProducts();
  
  const product = products?.find(p => p.id === productId);
  
  return {
    product,
    isLoading,
    error: error || (!isLoading && !product)
  };
} 