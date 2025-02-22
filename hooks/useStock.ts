import { useState, useEffect } from 'react';
import { unifiedStockService, StockData } from '../services/unifiedStockService';

export const useStock = (productId: string | null) => {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = unifiedStockService.subscribeToStock(productId, (data) => {
      setStockData(data);
      setIsLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [productId]);

  return {
    available: stockData ? stockData.available - stockData.reserved : 0,
    isLoading,
    error,
    stockData
  };
}; 