import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { Product, CartItem } from '../types';
import { useToast } from '@chakra-ui/react';

export const useCart = () => {
  const { data: products, error, isLoading } = useSWR<Product[]>('/api/products', async () => {
    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error('Error fetching products');
    }
    return response.json();
  }, {
    refreshInterval: 60000,
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const toast = useToast();

  const addToCart = useCallback((product: Product) => {
    if (!product.stock || product.stock === 0) {
      toast({
        title: "Sin stock",
        description: "Este producto no tiene stock disponible",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const cartItem = cart.find(item => item.id === product.id);
    if (cartItem && cartItem.quantity >= product.stock) {
      toast({
        title: "Stock máximo alcanzado",
        description: `Solo hay ${product.stock} unidades disponibles`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

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
  }, [cart, toast]);

  const removeFromCart = useCallback((product: Product) => {
    setCart(prevCart => prevCart.filter(item => item.id !== product.id));
  }, []);

  return { cart, addToCart, removeFromCart };
}; 