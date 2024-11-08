import { usePersistedCart } from './usePersistedCart';

export const useCart = () => {
  const { cart, addToCart, removeFromCart } = usePersistedCart();
  
  return {
    cart,
    addToCart,
    removeFromCart
  };
}; 