import { useState, useEffect, useCallback } from 'react';
import { CartItem, Product } from '../product/types';
import { useToast } from '@chakra-ui/react';

interface CartContextType {
  cart: CartItem[];
  isLoading: boolean;
  stockLevels: { [key: string]: number };
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (product: Product) => void;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

export const useCart = (): CartContextType => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stockLevels, setStockLevels] = useState<{ [key: string]: number }>({});
  const toast = useToast();

  // Cargar el carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Guardar el carrito en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback(async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}/stock`);
      const { stock } = await response.json();

      if (stock === 0) {
        toast({
          title: "Sin stock",
          description: "Este producto no tiene stock disponible",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const currentQuantity = cart.find(item => item.id === product.id)?.quantity || 0;

      if (currentQuantity >= stock) {
        toast({
          title: "Stock máximo alcanzado",
          description: `Solo hay ${stock} unidades disponibles`,
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

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
    } catch (error) {
      console.error('Error verificando stock:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar el stock disponible",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [cart, toast]);

  const removeFromCart = useCallback((product: Product) => {
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
  }, []);

  return {
    cart,
    isLoading,
    stockLevels,
    addToCart,
    removeFromCart,
    isInCart: (productId: string) => cart.some(item => item.id === productId),
    getItemQuantity: (productId: string) => cart.find(item => item.id === productId)?.quantity || 0
  };
}; 