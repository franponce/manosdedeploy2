import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

interface DynamicElementsProps {
  children: React.ReactNode;
}

export const DynamicElements: React.FC<DynamicElementsProps> = ({ children }) => {
  const router = useRouter();
  const [shouldShow, setShouldShow] = useState(false);
  
  useEffect(() => {
    const isProductPage = router.pathname.startsWith('/product');
    const isStoreConfigPage = router.pathname === '/store-config';
    
    // Resetear el estado cuando cambia la ruta
    setShouldShow(false);
    
    if (isStoreConfigPage) {
      return; // No mostrar en store-config
    }
    
    if (isProductPage) {
      return; // No mostrar en páginas de producto
    }
    
    // Solo en la página principal, mostrar después del delay
    const timer = setTimeout(() => {
      setShouldShow(true);
    }, 5000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [router.pathname]);

  // Escuchar cambios de ruta completos
  useEffect(() => {
    const handleRouteChangeComplete = () => {
      const isProductPage = router.pathname.startsWith('/product');
      if (isProductPage) {
        setShouldShow(false);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  if (!shouldShow) return null;

  return <>{children}</>;
}; 