import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, stockService } from '../utils/firebase';

interface StockHookReturn {
  stock: number;
  isLoading: boolean;
  error: Error | null;
}

export const useStock = (productId: string | null): StockHookReturn => {
  const [stock, setStock] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) return;

    const fetchStock = async () => {
      try {
        setIsLoading(true);
        const stockValue = await stockService.getProductStock(productId);
        setStock(stockValue);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStock();

    // Suscripción a cambios en tiempo real
    const unsubscribe = onSnapshot(doc(db, 'stock', productId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setStock(docSnapshot.data().quantity);
      }
    });

    return () => unsubscribe();
  }, [productId]);

  return { stock, isLoading, error };
}; 