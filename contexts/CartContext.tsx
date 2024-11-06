import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem, Product } from '../product/types';
import { useToast } from '@chakra-ui/react';
import { useProductStock } from '../hooks/useProductCache';

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  stockLevels: { [key: string]: number };
  isCartOpen: boolean;
}

interface CartContextType {
  cart: CartItem[];
  isLoading: boolean;
  stockLevels: { [key: string]: number };
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => void;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  toggleCart: (isOpen: boolean) => void;
}

const initialState: CartState = {
  items: [],
  isLoading: false,
  stockLevels: {},
  isCartOpen: false,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction = 
  | { type: 'ADD_ITEM'; payload: Product }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_STOCK'; payload: { id: string; stock: number } }
  | { type: 'TOGGLE_CART'; payload: boolean };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_STOCK':
      return {
        ...state,
        stockLevels: {
          ...state.stockLevels,
          [action.payload.id]: action.payload.stock,
        },
      };
    case 'TOGGLE_CART':
      return { ...state, isCartOpen: action.payload };
    default:
      return state;
  }
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const toast = useToast();

  // Cargar carrito desde localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const items = JSON.parse(savedCart);
      items.forEach((item: CartItem) => {
        dispatch({ type: 'ADD_ITEM', payload: item });
      });
    }
  }, []);

  // Guardar carrito en localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const fetchStock = async (productId: string): Promise<number> => {
    try {
      const { data } = useProductStock(productId);
      return data || 0;
    } catch (error) {
      console.error('Error fetching stock:', error);
      return 0;
    }
  };

  const addToCart = async (product: Product) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const stock = await fetchStock(product.id);
      const currentQuantity = state.items.find(item => item.id === product.id)?.quantity || 0;

      if (currentQuantity >= stock) {
        toast({
          title: "Stock máximo alcanzado",
          description: "Has alcanzado el máximo de unidades disponibles",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      dispatch({ type: 'ADD_ITEM', payload: product });
      dispatch({ type: 'TOGGLE_CART', payload: true });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const isInCart = (productId: string): boolean => {
    return state.items.some(item => item.id === productId);
  };

  const getItemQuantity = (productId: string): number => {
    return state.items.find(item => item.id === productId)?.quantity || 0;
  };

  const toggleCart = (isOpen: boolean) => {
    dispatch({ type: 'TOGGLE_CART', payload: isOpen });
  };

  const value: CartContextType = {
    cart: state.items,
    isLoading: state.isLoading,
    stockLevels: state.stockLevels,
    addToCart,
    removeFromCart,
    isInCart,
    getItemQuantity,
    toggleCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 