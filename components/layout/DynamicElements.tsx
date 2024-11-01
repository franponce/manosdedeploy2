import { useRouter } from 'next/router';
import { Box, Flex } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

interface DynamicElementsProps {
  children: React.ReactNode;
}

export const DynamicElements: React.FC<DynamicElementsProps> = ({ children }) => {
  const router = useRouter();
  const [shouldShow, setShouldShow] = useState(false);
  
  useEffect(() => {
    const isProductPage = router.pathname.startsWith('/product');
    
    if (!isProductPage) {
      // Solo mostrar después de 5 segundos en la página principal
      const timer = setTimeout(() => {
        setShouldShow(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
    
    setShouldShow(false);
  }, [router.pathname]);

  if (!shouldShow) return null;

  return <>{children}</>;
}; 