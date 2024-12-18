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
import { useStock } from '../../hooks/useStock';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useProductsStock } from '../../hooks/useProductsStock';
import { db, stockService } from '../../utils/firebase';
import { useVisibility } from '@/hooks/useVisibility';

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
  const toast = useToast({
    position: 'top',
  });
  const [isCartOpen, setIsCartOpen] = React.useState<boolean>(false);
  const [page, setPage] = React.useState(1);
  const [displayedProducts, setDisplayedProducts] = React.useState<Product[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const observer = React.useRef<IntersectionObserver | null>(null);
  const router = useRouter();
  const [cartUpdated, setCartUpdated] = React.useState<boolean>(false);

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

  // Optimizar el fetcher con cache más agresivo
  const { data: products, error, isLoading } = useSWR<Product[]>(
    SWR_KEYS.PRODUCTS, 
    fetcher, 
    {
      fallbackData: initialProducts,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutos
      errorRetryCount: 3,
      onError: (error) => {
        console.error('Error fetching products:', error);
        // Usar datos del cache si hay error
        return initialProducts;
      }
    }
  );

  const { data: categories } = useSWR<Category[]>(
    SWR_KEYS.CATEGORIES, 
    fetcher, 
    {
      fallbackData: initialCategories,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutos
      errorRetryCount: 3
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

  const filteredProducts = React.useMemo(() => {
    if (!products) return [];
    
    return products.filter(product => {
      const matchesSearch = !searchTerm ||
        product.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory ||
        product.categoryId === selectedCategory;
      
      return matchesSearch && matchesCategory && product.isVisible;
    });
  }, [products, searchTerm, selectedCategory]);

  const [visibilityStates, setVisibilityStates] = React.useState<{[key: string]: boolean}>({});

  React.useEffect(() => {
    if (!products?.length) return;

    const unsubscribes = products.map(product => {
      return onSnapshot(
        doc(db, 'visibility', product.id),
        (doc) => {
          if (doc.exists()) {
            setVisibilityStates(prev => ({
              ...prev,
              [product.id]: doc.data().isVisible
            }));
          }
        },
        (error) => {
          console.error('Error fetching visibility:', error);
        }
      );
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [products]);

  const visibleProducts = React.useMemo(() => {
    return filteredProducts.filter(product => 
      visibilityStates[product.id] ?? product.isVisible
    );
  }, [filteredProducts, visibilityStates]);

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
      const currentQuantity = cart.find(item => item.id === cartItem.id)?.quantity || 0;
      if (currentQuantity >= (stocks[product.id] || 0)) {
        toast({
          title: "No hay suficiente stock",
          description: "Has alcanzado el límite de unidades disponibles",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Solo mostrar toast si es la primera vez que se agrega el producto
      if (currentQuantity === 0) {
        addToCart(cartItem);
        toast({
          title: "Producto agregado",
          description: "El producto se agregó al carrito",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        addToCart(cartItem);
      }
    } else {
      removeFromCart(cartItem);
    }
  }

  const { stocks, isLoading: stocksLoading } = useProductsStock(displayedProducts);

  // Modificar el efecto de limpieza para incluir manejo de errores y debounce
  React.useEffect(() => {
    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout;

    const cleanupAndUpdateStocks = async () => {
      if (!isSubscribed || !displayedProducts.length) return;

      try {
        // Usar Promise.allSettled en lugar de Promise.all para manejar errores individuales
        const results = await Promise.allSettled(
          displayedProducts.map(async (product) => {
            try {
              await stockService.getProductStock(product.id);
            } catch (error) {
              console.error(`Error getting stock for product ${product.id}:`, error);
            }
          })
        );

        // Solo actualizar si el componente sigue montado
        if (isSubscribed) {
          mutate(SWR_KEYS.PRODUCTS_STOCK);
        }
      } catch (error) {
        console.error('Error in cleanup process:', error);
      }
    };

    // Debounce la limpieza para evitar demasiadas llamadas
    timeoutId = setTimeout(cleanupAndUpdateStocks, 1000);

    // Configurar intervalo con un tiempo más largo
    const interval = setInterval(cleanupAndUpdateStocks, 300000); // 5 minutos

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [displayedProducts]);

  useEffect(() => {
    if (isCartOpen) {
      // No es necesario hacer nada aquí
    }
  }, [isCartOpen]);

  // Efecto para asegurar que el componente se re-renderice cuando el carrito cambia
  React.useEffect(() => {
    if (cartUpdated) {
      setCartUpdated(false);
    }
  }, [cartUpdated]);

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
        ) : visibleProducts.length ? (
          <Grid
            gridGap={8}
            templateColumns={{
              base: "repeat(auto-fill, minmax(240px, 1fr))",
              sm: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {visibleProducts.map((product, index) => {
              const isLastElement = index === visibleProducts.length - 1;
              const available = stocks[product.id] || 0;

              return (
                <Box
                  key={product.id}
                  ref={isLastElement ? lastProductElementRef : null}
                  id={`product-${product.id}`}
                >
                  <ProductCard
                    product={product}
                    onAdd={(product) => handleEditCart(product, "increment")}
                    isLoading={isLoading || stocksLoading}
                    available={available}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onVisibilityToggle={() => {}}
                    isAdminView={false}
                    showStock={true}
                  />
                </Box>
              );
            })}
          </Grid>
        ) : (
          <Text>No se encontraron productos</Text>
        )}
        {isLoading && (
          <Center mt={4}>
            <Spinner size="xl" />
          </Center>
        )}
        {Boolean(cart.length) && (
          <Flex 
            alignItems="center" 
            bottom={4} 
            justifyContent="center" 
            position="sticky"
            zIndex={3}
          >
            <Button
              boxShadow="xl"
              colorScheme="primary"
              size="lg"
              width={{ base: "100%", sm: "fit-content" }}
              onClick={() => setIsCartOpen(true)}
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
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onIncrement={(product) => handleEditCart(product, "increment")}
        onDecrement={(product) => handleEditCart(product, "decrement")}
      />
    </>
  );
};

export default StoreScreen;