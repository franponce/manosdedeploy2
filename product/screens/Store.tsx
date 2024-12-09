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
  Container,
  SimpleGrid,
  VStack,
  Image,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { Product, Category } from "../types";
import { useCart } from '../../hooks/useCart';
import { StoreProductCard } from '../components/StoreProductCard';
import SiteInfoBanner from '../../components/SiteInfoBanner';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useSiteInfo } from '../../hooks/useSiteInfo';

interface StoreScreenProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

const PRODUCTS_PER_PAGE = 12;

const StoreScreen: React.FC<StoreScreenProps> = ({ initialProducts, initialCategories }) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [displayedProducts, setDisplayedProducts] = React.useState<Product[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const { products, isLoading: productsLoading } = useProducts(initialProducts);
  const { categories } = useCategories(initialCategories);
  const { addToCart } = useCart();
  const toast = useToast();
  const [bannerError, setBannerError] = React.useState(false);
  const { siteInfo } = useSiteInfo();

  // Efecto para procesar los productos
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
          product?.images?.length > 0 &&
          product?.price > 0
        );

        const isVisible = product.isVisible !== false;
        return isValidProduct && isVisible;
      });

      // Aplicar filtro de búsqueda
      if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Aplicar filtro de categoría
      if (selectedCategory) {
        filteredProducts = filteredProducts.filter(product => 
          product.categoryId === selectedCategory
        );
      }

      // Ordenar productos por orden si existe
      filteredProducts.sort((a, b) => {
        if (a.order && b.order) {
          return parseInt(a.order) - parseInt(b.order);
        }
        return 0;
      });

      setDisplayedProducts(filteredProducts.slice(0, page * PRODUCTS_PER_PAGE));
      setHasMore(page * PRODUCTS_PER_PAGE < filteredProducts.length);
    }
  }, [products, page, searchTerm, selectedCategory]);

  // Efecto para el scroll al último producto visto
  React.useEffect(() => {
    const lastViewedProductId = sessionStorage.getItem('lastViewedProductId');
    if (lastViewedProductId && displayedProducts.length > 0) {
      const productElement = document.getElementById(`product-${lastViewedProductId}`);
      if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        sessionStorage.removeItem('lastViewedProductId');
      }
    }
  }, [displayedProducts]);

  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };

  const handleAddToCart = (product: Product) => {
    addToCart({ ...product, quantity: 1 });
    toast({
      title: "Producto agregado",
      description: "El producto se agregó al carrito",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <>
      <Stack spacing={6}>
        <SiteInfoBanner siteInfo={siteInfo} />
        
        <Flex
          direction={{ base: "column", md: "row" }}
          gap={4}
          w="100%"
        >
          <InputGroup flex={{ base: "1", md: "1" }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={SearchIcon} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              w="100%"
            />
          </InputGroup>

          <Select
            placeholder="Todas las categorías"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            flex={{ base: "1", md: "1" }}
            w="100%"
          >
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Flex>

        {/* Grid de productos */}
        {productsLoading ? (
          <Center py={10}>
            <Spinner size="xl" />
          </Center>
        ) : displayedProducts.length > 0 ? (
          <VStack spacing={8} w="100%">
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
              spacing={6}
              w="100%"
            >
              {displayedProducts.map((product) => (
                <StoreProductCard
                  key={product.id}
                  product={product}
                  onAdd={handleAddToCart}
                  isLoading={false}
                />
              ))}
            </SimpleGrid>
            
            {hasMore && (
              <Button
                onClick={handleLoadMore}
                size="lg"
                colorScheme="blue"
                variant="outline"
              >
                Cargar más productos
              </Button>
            )}
          </VStack>
        ) : (
          <Center py={10}>
            <Text>No se encontraron productos disponibles.</Text>
          </Center>
        )}
      </Stack>
    </>
  );
};

export default StoreScreen;