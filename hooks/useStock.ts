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

    setIsLoading(true);
    const unsubscribe = onSnapshot(doc(db, 'stock', productId), 
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const availableStock = Number(data.available) || 0;
          const reservedStock = Number(data.reserved) || 0;
          
          // Calcular stock real disponible
          const realAvailable = Math.max(0, availableStock - reservedStock);
          setAvailable(realAvailable);
        } else {
          setAvailable(0);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching stock:', error);
        setError(error as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [productId]);

  return { available, isLoading, error };
}; 