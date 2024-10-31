import { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Product } from '../product/types';

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
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          setProduct({
            id: productSnap.id,
            ...productSnap.data() as Omit<Product, 'id'>
          });
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