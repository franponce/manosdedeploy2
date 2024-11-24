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

  useEffect(() => {
    if (!productId) return;

    const unsubscribe = onSnapshot(doc(db, 'stock', productId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const availableStock = Number(data.available) || 0;
        const reservedStock = Number(data.reserved) || 0;
        setAvailable(Math.max(0, availableStock - reservedStock));
      } else {
        setAvailable(0);
      }
    });

    return () => unsubscribe();
  }, [productId]);

  return { available, isLoading: false, error: null };
}; 