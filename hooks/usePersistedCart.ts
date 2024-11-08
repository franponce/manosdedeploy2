import { useState, useEffect } from 'react';
import { CartItem } from '@/product/types';

const CART_STORAGE_KEY = 'shopping-cart';
const CART_EXPIRY_HOURS = 24;

export const usePersistedCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Cargar carrito al iniciar
  useEffect(() => {
    const loadCart = () => {
      const cartJson = localStorage.getItem(CART_STORAGE_KEY);
      if (cartJson) {
        const cartData = JSON.parse(cartJson);
        if (cartData.expiry > Date.now()) {
          setCart(cartData.items);
        } else {
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    };

    loadCart();
  }, []);

  // Guardar carrito cuando cambie
  useEffect(() => {
    const saveCart = () => {
      const cartData = {
        items: cart,
        expiry: Date.now() + (CART_EXPIRY_HOURS * 60 * 60 * 1000)
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    };

    if (cart.length > 0) {
      saveCart();
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [cart]);

  const addToCart = (product: CartItem) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (product: CartItem) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem?.quantity === 1) {
        return currentCart.filter(item => item.id !== product.id);
      }
      return currentCart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  return {
    cart,
    addToCart,
    removeFromCart
  };
}; 