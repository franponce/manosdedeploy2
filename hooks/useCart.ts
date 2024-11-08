import { useState, useEffect } from 'react';
import { Product, CartItem } from '../product/types';

const CART_STORAGE_KEY = 'simple-ecommerce-cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCart(Array.isArray(parsedCart) ? parsedCart : []);
        } catch {
          setCart([]);
        }
      }
    }
  }, []);

  const addToCart = (product: Product) => {
    if (!product) return;
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (product: Product) => {
    if (!product) return;
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem?.quantity === 1) {
        return prevCart.filter(item => item.id !== product.id);
      }
      return prevCart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  return {
    cart: Array.isArray(cart) ? cart : [],
    addToCart,
    removeFromCart
  };
} 