import { useState, useEffect } from 'react';
import { Product } from '../product/types';
import { getProducts } from '../utils/googleSheets';

interface UseProductReturn {
  product: Product | null;
  isLoading: boolean;
  error: Error | null;
}

export const useProduct = (productId: string | undefined): UseProductReturn => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const products = await getProducts();
        const foundProduct = products.find((p: { id: string; }) => p.id === productId);

        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError(new Error('Producto no encontrado'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al cargar el producto'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  return { product, isLoading, error };
}; 