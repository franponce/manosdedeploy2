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
  Image,
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
import { FaEye, FaArrowLeft, FaTimes } from "react-icons/fa";

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
  const { data: products = initialProducts, error, isLoading } = useSWR<Product[]>(
    '/api/products',
    fetcher,
    {
      fallbackData: initialProducts,
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );
  const { data: categories = [], error: categoriesError } = useSWR<Category[]>('/api/categories');
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [productsStock, setProductsStock] = React.useState<Record<string, number>>({});

  const handleAddToCart = async (product: Product) => {
    try {
      const currentStock = productsStock[product.id] ?? product.stock;
      await addToCart({ ...product, stock: currentStock });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  function handleEditCart(product: Product, action: "increment" | "decrement") {
    if (action === "increment") {
      handleAddToCart(product);
    } else {
      removeFromCart(product);
    }
  }

  const renderStockStatus = (product: Product) => {
    const stock = typeof product.stock === 'number' ? product.stock : 0;

    if (stock <= 0) {
      return (
        <Text
          color="red.500"
          fontWeight="medium"
          fontSize="sm"
          textAlign="center"
        >
          Sin stock disponible
        </Text>
      );
    }

    return (
      <Text
        color="green.500"
        fontWeight="medium"
        fontSize="sm"
        textAlign="center"
      >
        Stock disponible: {stock} {stock === 1 ? "unidad" : "unidades"}
      </Text>
    );
  };

  React.useEffect(() => {
    if (products) {
      let filteredProducts = products.filter(product =>
        product && 
        product.id && 
        product.title && 
        !product.isScheduled && 
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

  const loadMore = React.useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prevPage => prevPage + 1);
    }
  }, [isLoading, hasMore]);

  const lastProductElementRef = React.useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadMore]);

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
    const updateStockForProducts = async () => {
      if (!displayedProducts?.length) return;

      const stockPromises = displayedProducts.map(async (product) => {
        try {
          const response = await fetch(`/api/products/${product.id}/stock`);
          const { stock } = await response.json();
          return { id: product.id, stock };
        } catch (error) {
          console.error(`Error fetching stock for product ${product.id}:`, error);
          return { id: product.id, stock: product.stock };
        }
      });

      const stockResults = await Promise.all(stockPromises);
      const newStockState = stockResults.reduce((acc, { id, stock }) => {
        acc[id] = stock;
        return acc;
      }, {} as Record<string, number>);

      setProductsStock(newStockState);
    };

    updateStockForProducts();
    const interval = setInterval(updateStockForProducts, 30000);

    return () => clearInterval(interval);
  }, [displayedProducts]);

  const total = React.useMemo(
    () => parseCurrency(cart.reduce((total, product) => total + product.price * product.quantity, 0)),
    [cart]
  );

  const quantity = React.useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

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
            {Array.isArray(categories) ? categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            )) : null}
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
              <ProductCard 
                key={index} 
                product={{} as Product} 
                onAdd={() => {}} 
                isLoading={true} 
              />
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
            {displayedProducts.map((product, index) => {
              const currentStock = productsStock[product.id] ?? product.stock;
              
              return (
                <Box
                  key={product.id}
                  ref={index === displayedProducts.length - 1 ? lastProductElementRef : null}
                >
                  <ProductCard
                    product={{
                      ...product,
                      stock: currentStock
                    }}
                    onAdd={handleAddToCart}
                    isLoading={false}
                    stockStatusRenderer={renderStockStatus}
                    buttonProps={{
                      isDisabled: !currentStock || currentStock === 0,
                      colorScheme: currentStock > 0 ? "blue" : "gray",
                      children: currentStock > 0 ? "Agregar al carrito" : "Sin stock disponible"
                    }}
                  />
                </Box>
              );
            })}
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
