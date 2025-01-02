import { useState, useEffect } from 'react';
import { stockService } from '../utils/stockService';

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
    if (!productId) {
      setIsLoading(false);
      return;
    }

    const fetchStock = async () => {
      try {
        setIsLoading(true);
        const stock = await stockService.getAvailableStock(productId);
        setAvailable(stock);
        setError(null);
      } catch (err) {
        console.error('Error fetching stock:', err);
        setError(err instanceof Error ? err : new Error('Error al obtener stock'));
        setAvailable(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStock();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStock, 30000);
    return () => clearInterval(interval);
  }, [productId]);

  return { available, isLoading, error };
}; 