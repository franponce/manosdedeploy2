import * as React from "react";
import {
  Button,
  Flex,
  Grid,
  Stack,
  Text,
  Box,
  Heading,
  useToast,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { CartItem, Product } from "../types";
import ProductCard from "../components/ProductCard";
import CartDrawer from "../components/CartDrawer";
import { editCart } from "../selectors";
import { parseCurrency } from "../../utils/currency";
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PRODUCTS_PER_PAGE = 12;

interface StoreScreenProps {
  initialProducts: Product[];
}

const CART_STORAGE_KEY = 'simple-ecommerce-cart';
const CART_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

const StoreScreen: React.FC<StoreScreenProps> = ({ initialProducts }) => {
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const toast = useToast();
  const [isCartOpen, toggleCart] = React.useState<boolean>(false);
  const [page, setPage] = React.useState(1);
  const [displayedProducts, setDisplayedProducts] = React.useState<Product[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const observer = React.useRef<IntersectionObserver | null>(null);
  const { data: products, error, isLoading } = useSWR<Product[]>('/api/products', fetcher, {
    fallbackData: initialProducts,
    refreshInterval: 60000, // Actualizar cada minuto
  });

  const lastProductElementRef = React.useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

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

  React.useEffect(() => {
    if (products) {
      const validProducts = products.filter(product =>
        product && product.id && product.title && product.image && product.price && !product.isScheduled
      );
      setDisplayedProducts(validProducts.slice(0, page * PRODUCTS_PER_PAGE));
      setHasMore(page * PRODUCTS_PER_PAGE < validProducts.length);
    }
  }, [products, page]);

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

  return (
    <>
      <Stack spacing={6}>
        {isLoading ? (
          <Grid
            gridGap={8}
            templateColumns={{
              base: "repeat(auto-fill, minmax(240px, 1fr))",
              sm: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductCard key={index} product={{} as Product} onAdd={() => {}} isLoading={true} />
            ))}
          </Grid>
        ) : displayedProducts.length ? (
          <Grid
            gridGap={8}
            templateColumns={{
              base: "repeat(auto-fill, minmax(240px, 1fr))",
              sm: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {displayedProducts.map((product, index) => (
              <Box
                key={product.id}
                ref={index === displayedProducts.length - 1 ? lastProductElementRef : null}
              >
                <ProductCard
                  product={product}
                  onAdd={(product) => handleEditCart(product, "increment")}
                  isLoading={false}
                />
              </Box>
            ))}
          </Grid>
        ) : (
          <Text color="gray.500" fontSize="lg" margin="auto">
            No hay productos cargados todavía, esperemos que pronto 😔
          </Text>
        )}
        {isLoading && (
          <Center mt={4}>
            <Spinner size="xl" />
          </Center>
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
