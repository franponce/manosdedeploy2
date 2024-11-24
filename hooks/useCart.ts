import { usePersistedCart } from './usePersistedCart';
import { useState, useCallback } from 'react';
import { CartItem } from '../product/types';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const { addToCart, removeFromCart } = usePersistedCart();
  
  const clearCart = useCallback(() => {
    setCart([]);
    // Limpiar el localStorage también
    localStorage.removeItem('cart');
  }, []);

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart
  };
}; 