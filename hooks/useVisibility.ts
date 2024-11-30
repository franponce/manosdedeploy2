import useSWR from 'swr';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';

interface VisibilityHookReturn {
  isVisible: boolean;
  isLoading: boolean;
  error: Error | null;
}

const fetcher = (productId: string) => 
  new Promise<boolean>((resolve, reject) => {
    const unsubscribe = onSnapshot(
      doc(db, 'visibility', productId),
      (doc) => {
        if (doc.exists()) {
          resolve(doc.data().isVisible);
        } else {
          resolve(true); // valor por defecto
        }
      },
      reject
    );
    
    return () => unsubscribe();
  });

export const useVisibility = (productId: string): VisibilityHookReturn => {
  const { data, error, isLoading } = useSWR(
    productId ? `/visibility/${productId}` : null,
    () => fetcher(productId),
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  return {
    isVisible: typeof data === 'boolean' ? data : true,
    isLoading,
    error: error as Error | null,
  };
}; 