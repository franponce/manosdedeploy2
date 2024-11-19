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
import { SWR_KEYS } from '../constants';
import SiteInfoBanner from '../../components/SiteInfoBanner';
import { useSiteInfo } from '../../hooks/useSiteInfo';
import { useRouter } from 'next/router';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();
  
  return data
    .map((product: Product) => ({
      ...product,
      isVisible: product.isVisible === undefined ? true : product.isVisible === true
    }))
    .sort((a: Product, b: Product) => {
      // Ordenar por el ID numérico (que refleja el orden en la hoja)
      return parseInt(a.id) - parseInt(b.id);
    });
};

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
  const [isCartOpen, toggleCart] = React.useState<boolean>(false);
  const [page, setPage] = React.useState(1);
  const [displayedProducts, setDisplayedProducts] = React.useState<Product[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const observer = React.useRef<IntersectionObserver | null>(null);
  const router = useRouter();

  // Prefetch de datos
  React.useEffect(() => {
    // Prefetch de productos
    const prefetchData = async () => {
      await Promise.all([
        router.prefetch('/admin'),
        router.prefetch('/'),
        mutate(SWR_KEYS.PRODUCTS),
        mutate(SWR_KEYS.CATEGORIES)
      ]);
    };
    
    prefetchData();
  }, [router]);

  // Optimizar el fetcher con cache
  const { data: products, error, isLoading } = useSWR<Product[]>(
    SWR_KEYS.PRODUCTS, 
    fetcher, 
    {
      fallbackData: initialProducts,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minuto
    }
  );

  const { data: categories } = useSWR<Category[]>(
    SWR_KEYS.CATEGORIES, 
    fetcher, 
    {
      fallbackData: initialCategories,
      refreshInterval: 60000,
    }
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const { siteInfo } = useSiteInfo();
  const [bannerError, setBannerError] = React.useState(false);

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
      // Asegurarnos de que los productos sean únicos por ID
      const uniqueProducts = Array.from(
        new Map(products.map(product => [product.id, product])).values()
      );

      let filteredProducts = uniqueProducts.filter(product => {
        const isValidProduct = Boolean(
          product?.id &&
          product?.title &&
          product?.images &&
          product?.price &&
          !product?.isScheduled
        );

        // Ser explícitos con la visibilidad
        const isVisible = product.isVisible !== false;

        return isValidProduct && isVisible;
      });

      if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (selectedCategory) {
        filteredProducts = filteredProducts.filter(product => 
          product.categoryId === selectedCategory
        );
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

  function handleEditCart(product: Product, action: "increment" | "decrement") {
    const cartItem: CartItem = {
      ...product,
      quantity: 1
    };
    
    if (action === "increment") {
      addToCart(cartItem);
    } else {
      removeFromCart(cartItem);
    }
  }

  const NoProductsFound = () => {
    if (!searchTerm && !selectedCategory) {
      return (
        <Center flexDirection="column" p={8} bg="gray.50" borderRadius="lg">
          <Box 
            as="span" 
            fontSize="6xl" 
            mb={4}
            role="img" 
            aria-label="No hay productos"
          >
            📦
          </Box>
          <Heading size="md" mb={2} textAlign="center">
            No hay productos disponibles
          </Heading>
          <Text color="gray.600" textAlign="center">
            Los productos pueden estar temporalmente ocultos o no disponibles.
          </Text>
        </Center>
      );
    }

    return (
      <Center flexDirection="column" p={8} bg="gray.50" borderRadius="lg">
        <Box 
          as="span" 
          fontSize="6xl" 
          mb={4}
          role="img" 
          aria-label="Buscando"
        >
          🔍
        </Box>
        <Heading size="md" mb={2} textAlign="center">
          No se encontraron productos
        </Heading>
        <Text color="gray.600" textAlign="center">
          {searchTerm 
            ? "No hay productos que coincidan con tu búsqueda."
            : selectedCategory 
              ? "No hay productos en esta categoría."
              : "No hay productos disponibles en este momento."}
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
  };

  if (error) return <div>Failed to load products</div>;

  return (
    <>
      <Stack spacing={6}>
        <Box 
          borderRadius="lg"
          height={{ md: "300px" }}
          overflow="hidden"
          width="100%"
          position="relative"
        >
          <Image
            src={bannerError ? "/default-banner.jpg" : `${siteInfo?.bannerUrl}?${new Date().getTime()}`}
            alt="Header image"
            objectFit="cover"
            width="100%"
            height="100%"
            onError={() => setBannerError(true)}
            fallback={<Box bg="gray.200" w="100%" h="100%" />}
          />
        </Box>

        <SiteInfoBanner siteInfo={siteInfo} />
        
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
              <ProductCard
                key={`skeleton-${index}`}
                product={{
                  id: `skeleton-${index}`,
                  title: '',
                  description: '',
                  images: [],
                  stock: 0,
                  price: 0,
                  currency: 'ARS',
                  isScheduled: false,
                  scheduledPublishDate: null,
                  categoryId: '',
                  isVisible: true,
                  order: ''
                }}
                onAdd={() => {}}
                isLoading={true}
                onEdit={() => {}}
                onDelete={() => {}}
                onVisibilityToggle={() => {}}
                isAdminView={false}
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
            {displayedProducts.map((product, index) => (
              <Box
                key={product.id}
                ref={index === displayedProducts.length - 1 ? lastProductElementRef : null}
                id={`product-${product.id}`}
              >
                <ProductCard
                  product={product}
                  onAdd={(product) => handleEditCart(product, "increment")}
                  isLoading={false}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onVisibilityToggle={() => {}}
                  isAdminView={false}
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