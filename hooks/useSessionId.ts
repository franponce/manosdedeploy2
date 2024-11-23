import { useState, useEffect } from 'react';

export const useSessionId = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Verificar que estamos en el cliente
    if (typeof window !== 'undefined') {
      const storedSessionId = window.localStorage.getItem('sessionId');
      const newSessionId = storedSessionId || crypto.randomUUID();
      
      if (!storedSessionId) {
        window.localStorage.setItem('sessionId', newSessionId);
      }
      
      setSessionId(newSessionId);
      setIsReady(true);
    }
  }, []);

  return { sessionId, isReady };
}; 