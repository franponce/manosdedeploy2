import { useState, useEffect } from 'react';
import { auth, isAdminUser } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && (currentUser.email || isAdminUser(currentUser))) {
        setUser(currentUser as any); // Usamos 'as any' para evitar el error de tipo
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};
