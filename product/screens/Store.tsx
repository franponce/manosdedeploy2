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
import { useRouter } from 'next/router';
import { Container } from "@chakra-ui/react";
import { FaEye, FaArrowLeft } from "react-icons/fa";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PRODUCTS_PER_PAGE = 12;

interface StoreScreenProps {
  initialProducts: Product[];
  initialCategories: Category[];
  isPreviewMode?: boolean;
}

const StoreScreen: React.FC<StoreScreenProps> = ({ 
  initialProducts, 
  initialCategories,
  isPreviewMode = false
}) => {
  const router = useRouter();
  const { cart, addToCart, removeFromCart } = useCart();
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
  const { data: categories } = useSWR<Category[]>('/api/categories', fetcher, {
    fallbackData: initialCategories,
    refreshInterval: 60000,
  });
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");

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
        product && 
        product.id && 
        product.title && 
        product.image && 
        product.price && 
        !product.isScheduled && // Solo muestra productos no programados
        product.title.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (selectedCategory) {
        filteredProducts = filteredProducts.filter(product => 
          product.categoryId === selectedCategory
        );
      }

      setDisplayedProducts(filteredProducts.slice(0, page * PRODUCTS_PER_PAGE));
      setHasMore(page * PRODUCTS_PER_PAGE < filteredProducts.length);
    }
  }, [products, page, searchTerm, selectedCategory]);

  const total = React.useMemo(
    () => parseCurrency(cart.reduce((total, product) => total + product.price * product.quantity, 0)),
    [cart]
  );

  const quantity = React.useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  function handleEditCart(product: Product, action: "increment" | "decrement") {
    if (action === "increment") {
      addToCart(product);
    } else {
      removeFromCart(product);
    }
  }

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

  if (error) return <div>Failed to load products</div>;

  return (
    <>
      {isPreviewMode && (
        <Box
          position="sticky"
          top="70px" // Altura del header principal
          zIndex={999}
          bg="blue.50"
          py={3}
          borderBottom="1px"
          borderColor="blue.100"
        >
          <Container maxW="container.xl">
            <Flex
              justify="space-between"
              align="center"
              direction={{ base: "column", sm: "row" }}
              gap={3}
            >
              <Flex align="center" gap={2}>
                <Icon as={FaEye} color="blue.500" />
                <Text color="blue.700">
                  Estas en Modo Previsualización. Así ven los clientes tu tienda actualmente.
                </Text>
              </Flex>
              <Button
                size="sm"
                colorScheme="blue"
                variant="outline"
                leftIcon={<Icon as={FaArrowLeft} />}
                onClick={() => router.push('/admin')}
              >
                Cerrar y volver a editar la tienda
              </Button>
            </Flex>
          </Container>
        </Box>
      )}
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
