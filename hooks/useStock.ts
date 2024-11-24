import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, stockService } from '../utils/firebase';

interface StockHookReturn {
  available: number;
  isLoading: boolean;
  error: Error | null;
}

export const useStock = (productId: string | null): StockHookReturn => {
  const [available, setAvailable] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) return;

    const fetchStock = async () => {
      try {
        setIsLoading(true);
        const stockValue = await stockService.getAvailableStock(productId);
        setAvailable(stockValue);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStock();

    // Suscripción a cambios en tiempo real del stock disponible
    const unsubscribe = onSnapshot(doc(db, 'stock', productId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const availableStock = data.available - data.reserved;
        setAvailable(availableStock);
      }
    });

    return () => unsubscribe();
  }, [productId]);

  return { available, isLoading, error };
}; 