import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';

interface VisibilityHookReturn {
  isVisible: boolean;
  isLoading: boolean;
  error: Error | null;
}

export const useVisibility = (productId: string): VisibilityHookReturn => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!productId) return;

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, 'visibility', productId),
      (doc) => {
        if (doc.exists()) {
          setIsVisible(doc.data().isVisible);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching visibility:', error);
        setError(error as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [productId]);

  return { isVisible, isLoading, error };
}; 