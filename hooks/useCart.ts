import { useState, useCallback, useEffect } from 'react';
import { CartItem } from '../product/types';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Cargar carrito del localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  const addToCart = useCallback((product: CartItem) => {
    setCart(currentCart => {
      const updatedCart = [...currentCart];
      const existingProductIndex = updatedCart.findIndex(item => item.id === product.id);

      if (existingProductIndex >= 0) {
        updatedCart[existingProductIndex].quantity += product.quantity;
      } else {
        updatedCart.push({ ...product });
      }

      // Guardar en localStorage
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  }, []);

  const removeFromCart = useCallback((product: CartItem) => {
    setCart(currentCart => {
      const updatedCart = currentCart.map(item => {
        if (item.id === product.id) {
          return {
            ...item,
            quantity: Math.max(0, item.quantity - 1)
          };
        }
        return item;
      }).filter(item => item.quantity > 0);

      // Guardar en localStorage
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    localStorage.removeItem('cart');
  }, []);

  const updateItemQuantity = useCallback((product: CartItem, quantity: number) => {
    setCart(currentCart => {
      const updatedCart = currentCart.map(item => {
        if (item.id === product.id) {
          return {
            ...item,
            quantity: Math.max(0, quantity)
          };
        }
        return item;
      }).filter(item => item.quantity > 0);

      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  }, []);

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    updateItemQuantity
  };
}; 