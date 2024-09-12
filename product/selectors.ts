import { CartItem, Product } from "./types";

export function editCart(product: Product, action: "increment" | "decrement") {
  return (cart: CartItem[]): CartItem[] => {
    const existingItemIndex = cart.findIndex((item) => item.id === product.id);

    if (existingItemIndex === -1) {
      // El producto no está en el carrito, lo añadimos
      return [...cart, { ...product, quantity: 1 }];
    }

    // El producto ya está en el carrito, actualizamos la cantidad
    return cart.map((item, index) => {
      if (index !== existingItemIndex) {
        return item;
      }

      switch (action) {
        case "decrement":
          return item.quantity === 1
            ? null // Eliminamos el item si la cantidad llega a 0
            : { ...item, quantity: item.quantity - 1 };
        case "increment":
          return { ...item, quantity: item.quantity + 1 };
        default:
          return item;
      }
    }).filter((item): item is CartItem => item !== null); // Filtramos los items null
  };
}