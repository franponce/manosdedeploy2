import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Product } from '../product/types';

interface StockMap {
  [productId: string]: number;
}

export const useProductsStock = (products: Product[]) => {
  const [stocks, setStocks] = useState<StockMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!products.length) {
      setIsLoading(false);
      return;
    }

    const unsubscribers = products.map(product => {
      return onSnapshot(doc(db, 'stock', product.id), 
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const availableStock = Number(data.available) || 0;
            const reservedStock = Number(data.reserved) || 0;
            const realAvailable = Math.max(0, availableStock - reservedStock);
            
            setStocks(prev => ({
              ...prev,
              [product.id]: realAvailable
            }));
          } else {
            setStocks(prev => ({
              ...prev,
              [product.id]: 0
            }));
          }
        }
      );
    });

    setIsLoading(false);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [products]);

  return { stocks, isLoading };
}; 