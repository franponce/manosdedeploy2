import { useEffect } from 'react';

export const useScrollPosition = (productId: string | undefined) => {
  // Guardar la posición al salir
  const saveScrollPosition = () => {
    const scrollPosition = window.scrollY;
    localStorage.setItem('lastScrollPosition', scrollPosition.toString());
    localStorage.setItem('lastViewedProduct', productId || '');
  };

  // Restaurar la posición al volver
  const restoreScrollPosition = () => {
    const lastViewedProduct = localStorage.getItem('lastViewedProduct');
    const savedPosition = localStorage.getItem('lastScrollPosition');
    
    if (lastViewedProduct && savedPosition) {
      window.scrollTo({
        top: parseInt(savedPosition),
        behavior: 'smooth'
      });
      // Limpiar después de usar
      localStorage.removeItem('lastScrollPosition');
      localStorage.removeItem('lastViewedProduct');
    }
  };

  return { saveScrollPosition, restoreScrollPosition };
}; 