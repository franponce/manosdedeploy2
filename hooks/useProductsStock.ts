import { useState, useEffect } from 'react';
import { Product } from '../product/types';
import { unifiedStockService } from '../services/unifiedStockService';

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
      return unifiedStockService.subscribeToStock(product.id, (stockData) => {
        const realAvailable = Math.max(0, stockData.available - stockData.reserved);
        setStocks(prev => ({
          ...prev,
          [product.id]: realAvailable
        }));
      });
    });

    setIsLoading(false);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [products]);

  return { stocks, isLoading };
}; 