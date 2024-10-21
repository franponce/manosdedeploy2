import React, { useState, useEffect } from "react";
import {
  Button,
  Flex,
  Grid,
  Stack,
  Text,
  Box,
  Heading,
  useToast,
} from "@chakra-ui/react";
import { CartItem, Product } from "../types";
import ProductCard from "../components/ProductCard";
import CartDrawer from "../components/CartDrawer";
import { editCart } from "../selectors";
import { parseCurrency } from "../../utils/currency";
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StoreScreenProps {
  initialProducts: Product[];
}

const CART_STORAGE_KEY = 'simple-ecommerce-cart';
const CART_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

const REFRESH_INTERVAL = 10000; // 10 segundos

const StoreScreen: React.FC<StoreScreenProps> = ({ initialProducts }) => {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const toast = useToast();
  const [isCartOpen, toggleCart] = React.useState<boolean>(false);
  const { data: products, error, mutate } = useSWR<Product[]>('/api/products', fetcher, {
    fallbackData: initialProducts,
    refreshInterval: REFRESH_INTERVAL,
  });

  React.useEffect(() => {
    // Cargar el carrito desde localStorage cuando el componente se monta
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
  }, [toast]);

  React.useEffect(() => {
    // Guardar el carrito en localStorage cada vez que cambie
    saveCartToStorage(cart);
  }, [cart]);

  React.useEffect(() => {
    const checkScheduledProducts = () => {
      const now = new Date();
      const updatedProducts = products?.map(product => {
        if (product.isScheduled && product.scheduledPublishDate && new Date(product.scheduledPublishDate) <= now) {
          return { ...product, isScheduled: false };
        }
        return product;
      });
      if (updatedProducts && JSON.stringify(updatedProducts) !== JSON.stringify(products)) {
        mutate(updatedProducts, false);
      }
    };

    checkScheduledProducts();
    const interval = setInterval(checkScheduledProducts, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, [products, mutate]);

  const total = React.useMemo(
    () => parseCurrency(cart.reduce((total, product) => total + product.price * product.quantity, 0)),
    [cart]
  );

  const quantity = React.useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  function handleEditCart(product: Product, action: "increment" | "decrement") {
    setCart(editCart(product, action));
  }

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
      } else {
        // El carrito ha expirado, lo eliminamos
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
    return { savedCart: null, wasRecovered: false };
  }

  if (error) return <div>Failed to load products</div>;
  if (!products) return <div>Loading...</div>;

  const validProducts = products?.filter(product =>
    product && product.id && product.title && product.image && product.price && !product.isScheduled
  ) || [];

  const handleAddToCart = (product: Product) => {
    if (product.stock > 0) {
      handleEditCart(product, "increment");
    }
  };

  return (
    <>
      <Stack spacing={6}>
        {validProducts.length ? (
          <Grid
            gridGap={8}
            templateColumns={{
              base: "repeat(auto-fill, minmax(240px, 1fr))",
              sm: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {products?.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
                isOutOfStock={product.stock <= 0}
              />
            ))}
          </Grid>
        ) : (
          <Text color="gray.500" fontSize="lg" margin="auto">
            No hay productos cargados todavía, esperemos que pronto :/
          </Text>
        )}
        {Boolean(cart.length) && (
          <Flex alignItems="center" bottom={4} justifyContent="center" position="sticky">
            <Button
              boxShadow="xl"
              colorScheme="primary"
              data-testid="show-cart"
              size="lg"
              width={{ base: "100%", sm: "fit-content" }}
              onClick={() => toggleCart(true)}
            >
              <Stack alignItems="center" direction="row" spacing={6}>
                <Stack alignItems="center" direction="row" spacing={3}>
                  <Text fontSize="md" lineHeight={6}>
                    Ver carrito
                  </Text>
                  <Text
                    backgroundColor="rgba(0,0,0,0.25)"
                    borderRadius="sm"
                    color="gray.100"
                    fontSize="xs"
                    fontWeight="500"
                    paddingX={2}
                    paddingY={1}
                  >
                    {quantity} {quantity === 1 ? "item" : "items"}
                  </Text>
                </Stack>
                <Text fontSize="md" lineHeight={6}>
                  {total}
                </Text>
              </Stack>
            </Button>
          </Flex>
        )}
      </Stack>
      <CartDrawer
        isOpen={isCartOpen}
        items={cart}
        onClose={() => toggleCart(false)}
        onDecrement={(product) => handleEditCart(product, "decrement")}
        onIncrement={(product) => handleEditCart(product, "increment")}
      />
    </>
  );
};

export default StoreScreen;
