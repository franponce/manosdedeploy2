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
  Input,
  Select,
  InputGroup,
  InputLeftElement,
  Icon,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { CartItem, Product, Category } from "../types";
import ProductCard from "../components/ProductCard";
import CartDrawer from "../components/CartDrawer";
import { editCart } from "../selectors";
import { parseCurrency } from "../../utils/currency";
import useSWR, { mutate } from 'swr';
import { useCart } from '../../hooks/useCart';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PRODUCTS_PER_PAGE = 12;

interface StoreScreenProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

const CART_STORAGE_KEY = 'simple-ecommerce-cart';
const CART_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

const StoreScreen: React.FC<StoreScreenProps> = ({ initialProducts, initialCategories }) => {
  const { cart, addToCart, removeFromCart } = useCart();
  const toast = useToast();
  const [isCartOpen, setIsCartOpen] = React.useState<boolean>(false);
  const [page, setPage] = React.useState(1);
  const [displayedProducts, setDisplayedProducts] = React.useState<Product[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const observer = React.useRef<IntersectionObserver | null>(null);
  const { 
    data: products, 
    mutate,
    isLoading,
    error: isError 
  } = useSWR<Product[]>('/api/products', fetcher, {
    fallbackData: initialProducts,
    refreshInterval: 5000,
    revalidateOnFocus: true,
    dedupingInterval: 3000,
    onError: (error) => {
      console.error('Error fetching products:', error);
    }
  });
  const { 
    categories, 
    isLoading: categoriesLoading, 
    error: categoriesError 
  } = useCategories();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");

  const lastProductElementRef = React.useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
        mutate();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, mutate]);

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
      let filteredProducts = products.filter(product =>
        product && product.id && product.title && product.image && product.price && !product.isScheduled &&
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (selectedCategory) {
        filteredProducts = filteredProducts.filter(product => product.categoryId === selectedCategory);
      }

      setDisplayedProducts(filteredProducts.slice(0, page * PRODUCTS_PER_PAGE));
      setHasMore(page * PRODUCTS_PER_PAGE < filteredProducts.length);
    }
  }, [products, page, searchTerm, selectedCategory]);

  React.useEffect(() => {
    const lastViewedProductId = sessionStorage.getItem('lastViewedProductId');
    if (lastViewedProductId && displayedProducts.length > 0) {
      const productElement = document.getElementById(`product-${lastViewedProductId}`);
      if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Limpiar el ID guardado después de scrollear
        sessionStorage.removeItem('lastViewedProductId');
      }
    }
  }, [displayedProducts]);

  const total = React.useMemo(
    () => parseCurrency(cart.reduce((total, product) => total + product.price * product.quantity, 0)),
    [cart]
  );

  const quantity = React.useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const handleIncrement = (product: Product) => {
    const cartItem: CartItem = {
      ...product,
      quantity: 1
    };
    addToCart(cartItem);
  };

  const handleDecrement = (product: Product) => {
    const cartItem: CartItem = {
      ...product,
      quantity: 1
    };
    removeFromCart(cartItem);
  };

  const NoProductsFound = () => {
    if (selectedCategory && !searchTerm) {
      return (
        <Center flexDirection="column" p={8} bg="gray.50" borderRadius="lg" boxShadow="sm">
          <Box 
            as="span" 
            fontSize="6xl" 
            mb={4} 
            role="img" 
            aria-label="Categoría vacía"
            className="empty-category-emoji"
          >
            📦
          </Box>
          <Heading as="h3" size="md" textAlign="center" mb={2}>
            Aún no hay productos en esta categoría
          </Heading>
          <Text color="gray.600" textAlign="center" maxW="md">
            Estamos trabajando para agregar nuevos productos. ¡Te invitamos a seguir navegando!
          </Text>
        </Center>
      );
    } else {
      return (
        <Center flexDirection="column" p={8} bg="gray.50" borderRadius="lg" boxShadow="sm">
          <Box 
            as="span" 
            fontSize="6xl" 
            mb={4} 
            role="img" 
            aria-label="Buscando"
            className="thinking-emoji"
          >
            🔍
          </Box>
          <Heading as="h3" size="md" textAlign="center" mb={2}>
            No se encontraron productos
          </Heading>
          <Text color="gray.600" textAlign="center" maxW="md">
            que coincidan con tu búsqueda. Intenta con otros términos o categorías.
          </Text>
          {searchTerm && (
            <Button 
              mt={4} 
              colorScheme="blue" 
              onClick={() => setSearchTerm("")}
            >
              Limpiar búsqueda
            </Button>
          )}
        </Center>
      );
    }
  };

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      mutate();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [mutate]);

  React.useEffect(() => {
    const handleFocus = () => {
      mutate();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [mutate]);

  const visibleProducts = React.useMemo(() => {
    return products?.filter(product => !product.isHidden) || [];
  }, [products]);

  // Efecto para revalidar cuando el componente se monta y cuando recupera el foco
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        mutate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mutate]);

  React.useEffect(() => {
    if (categoriesError) {
      console.error('Error loading categories:', categoriesError);
    }
  }, [categoriesError]);

  if (isError) return <div>Failed to load products</div>;

  return (
    <>
      <Stack spacing={6}>
        <Flex direction={{ base: "column", md: "row" }} gap={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={SearchIcon} color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Select
            placeholder="Todas las categorías"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Flex>

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
        ) : visibleProducts.length ? (
          <Grid
            gridGap={8}
            templateColumns={{
              base: "repeat(auto-fill, minmax(240px, 1fr))",
              sm: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {visibleProducts.map((product, index) => (
              <Box
                key={product.id}
                ref={index === visibleProducts.length - 1 ? lastProductElementRef : null}
                id={`product-${product.id}`}
              >
                <ProductCard
                  product={product}
                  onAdd={handleIncrement}
                  isLoading={false}
                />
              </Box>
            ))}
          </Grid>
        ) : (
          <NoProductsFound />
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
              onClick={() => setIsCartOpen(true)}
              size="lg"
              width={{ base: "100%", sm: "fit-content" }}
            >
              Ver carrito ({cart.reduce((acc, item) => acc + item.quantity, 0)} items)
            </Button>
          </Flex>
        )}
      </Stack>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onIncrement={(item) => addToCart(item)}
        onDecrement={(item) => removeFromCart(item)}
      />
    </>
  );
};

export default StoreScreen;

