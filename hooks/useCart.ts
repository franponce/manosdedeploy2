import { useState, useEffect } from 'react';
import { CartItem, Product } from '../product/types';
import { useToast } from '@chakra-ui/react';

const CART_STORAGE_KEY = 'simple-ecommerce-cart';
const CART_EXPIRY_TIME = 24 * 60 * 60 * 1000;

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const toast = useToast();

  useEffect(() => {
    const { savedCart, wasRecovered } = loadCartFromStorage();
    if (savedCart) {
      setCart(savedCart);
      if (wasRecovered) {
        toast({
          title: "Carrito recuperado",
          description: "Hemos recuperado los productos de tu carrito anterior.",
          status: "info",
          duration: 4000,
          isClosable: true,
          position: "bottom-right",
        });
      }
    }
  }, []);

  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  const addToCart = (product: Product | CartItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      const quantity = 'quantity' in product ? product.quantity : 1;
      return [...prevCart, { ...product, quantity }];
    });
  };

  const removeFromCart = (product: Product | CartItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prevCart.filter(item => item.id !== product.id);
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
  };
};

function saveCartToStorage(cartItems: CartItem[]) {
  const cartData = {
    items: cartItems,
    expiry: Date.now() + CART_EXPIRY_TIME
  };
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
}

function loadCartFromStorage(): { savedCart: CartItem[] | null, wasRecovered: boolean } {
  const cartJson = localStorage.getItem(CART_STORAGE_KEY);
  if (cartJson) {
    const cartData = JSON.parse(cartJson);
    if (cartData.expiry > Date.now()) {
      return { savedCart: cartData.items, wasRecovered: true };
    }
    localStorage.removeItem(CART_STORAGE_KEY);
  }
  return { savedCart: null, wasRecovered: false };
} 