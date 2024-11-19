import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  SimpleGrid,
  useToast,
  AspectRatio,
  Image,
  HStack,
  VStack,
  Flex,
  Center,
  Icon,
  InputGroup,
  InputLeftElement,
  Heading,
  Badge,
  Spinner,
  Tooltip,
  Grid,
  IconButton,
  Switch,
  Stack,
} from "@chakra-ui/react";
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { FaTrash, FaEye, FaEyeSlash } from "react-icons/fa";
import ProductModal from "./ProductModal";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../../utils/googleSheets";
import { Product } from "../types";
import useSWR, { mutate } from 'swr';
import ImageCarousel from '../components/ImageCarousel';
import { parseCurrency } from '../../utils/currency';
import { SWR_KEYS } from '../constants';

const PRODUCT_LIMIT = 30;
const SYNC_INTERVAL = 30000; // 30 segundos

interface ProductManagementProps {
  onCreateProduct: () => void;
  showHiddenProducts: boolean;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ 
  onCreateProduct, 
  showHiddenProducts 
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const toast = useToast();
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);

  const lastProductElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  const fetchProducts = useCallback(async () => {
    try {
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
    const intervalId = setInterval(fetchProducts, SYNC_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchProducts]);

  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.title.toLowerCase().includes(lowercasedTerm) ||
        product.description.toLowerCase().includes(lowercasedTerm) ||
        product.price.toString().includes(lowercasedTerm)
    );
    setFilteredProducts(filtered);
    setPage(1);
    setHasMore(true);
  }, [searchTerm, products]);

  useEffect(() => {
    const PRODUCTS_PER_PAGE = 10;
    setDisplayedProducts(filteredProducts.slice(0, page * PRODUCTS_PER_PAGE));
    setHasMore(page * PRODUCTS_PER_PAGE < filteredProducts.length);
  }, [filteredProducts, page]);

  useEffect(() => {
    if (!products) return;
    
    const filtered = products
      .filter(product => showHiddenProducts ? true : product.isVisible)
      .filter(product => {
        if (!searchTerm) return true;
        return product.title.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .filter(product => {
        if (!selectedCategory) return true;
        return product.categoryId === selectedCategory;
      });

    setDisplayedProducts(filtered);
  }, [products, searchTerm, selectedCategory, showHiddenProducts]);

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        await deleteProduct(id);
        await fetchProducts();
        toast({
          title: "Producto eliminado",
          description: "El producto ha sido eliminado exitosamente.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error deleting product:", error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    try {
      const updatedProduct = {
        ...product,
        isVisible: !product.isVisible
      };
      await updateProduct(updatedProduct);
      await fetchProducts();
      
      toast({
        title: "Visibilidad actualizada",
        description: `El producto ahora está ${updatedProduct.isVisible ? 'visible' : 'oculto'} en la tienda`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating product visibility:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la visibilidad del producto",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async (product: Product) => {
    setIsLoading(true);
    try {
      if (product.id) {
        await updateProduct(product);
      } else {
        await createProduct(product);
      }
      setIsModalOpen(false);
      setCurrentProduct(null);
      
      await mutate('/api/products');
      await fetchProducts();

      toast({
        title: "Éxito",
        description: `Producto ${product.id ? "actualizado" : "creado"} exitosamente.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido al guardar el producto",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isProductScheduled = (product: Product): boolean => {
    if (!product.isScheduled || !product.scheduledPublishDate) return false;
    
    const scheduledDate = new Date(product.scheduledPublishDate);
    const now = new Date();
    
    const argentinaTime = new Date(now.toLocaleString('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires'
    }));
    
    return scheduledDate > argentinaTime;
  };

  const [expandedTitles, setExpandedTitles] = useState<{ [key: string]: boolean }>({});
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});

  const toggleTitle = (productId: string) => {
    setExpandedTitles(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const toggleDescription = (productId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const formatScheduledDate = (date: string | null | undefined) => {
    if (!date) return '';
    
    const scheduledDate = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    };

    return new Intl.DateTimeFormat('es-AR', options).format(scheduledDate);
  };

  const checkAndUpdateScheduledProducts = useCallback(async () => {
    const now = new Date();
    const productsToUpdate = products.filter(product => 
      product.isScheduled && 
      product.scheduledPublishDate && 
      new Date(product.scheduledPublishDate) <= now
    );

    for (const product of productsToUpdate) {
      try {
        await updateProduct({
          ...product,
          isScheduled: false,
          scheduledPublishDate: null,
          isVisible: true // El producto se hace visible automáticamente
        });
      } catch (error) {
        console.error(`Error actualizando producto programado ${product.id}:`, error);
      }
    }

    if (productsToUpdate.length > 0) {
      await fetchProducts(); // Actualizar la lista después de los cambios
    }
  }, [products]);

  // Ejecutar la verificación cada minuto
  useEffect(() => {
    const interval = setInterval(checkAndUpdateScheduledProducts, 60000);
    return () => clearInterval(interval);
  }, [checkAndUpdateScheduledProducts]);

  const handleVisibilityToggle = async (product: Product) => {
    try {
      const updatedProduct = {
        ...product,
        isVisible: !product.isVisible
      };
      await updateProduct(updatedProduct);
      mutate(SWR_KEYS.PRODUCTS);
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const renderProduct = (product: Product) => (
    <Box
      key={product.id}
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      position="relative"
    >
      {/* Contenedor de imágenes */}
      <Box 
        position="relative" 
        height="200px"
        mb={4}
        onClick={(e) => e.preventDefault()}
      >
        <ImageCarousel
          images={Array.isArray(product.images) ? product.images : product.images ? [product.images] : []}
        />
      </Box>

      {/* Información del producto */}
      <Stack spacing={2}>
        <Heading size="md">{product.title}</Heading>
        <Text color="gray.600">{parseCurrency(product.price)}</Text>
        <Text noOfLines={2}>{product.description}</Text>
        
        {/* Acciones */}
        <Flex justify="space-between" align="center" mt={2}>
          <HStack>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => handleEdit(product)}
            >
              Editar
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              onClick={() => handleDelete(product.id)}
            >
              Eliminar
            </Button>
          </HStack>
          <Switch
            isChecked={product.isVisible}
            onChange={() => handleVisibilityToggle(product)}
          />
        </Flex>
      </Stack>
    </Box>
  );

  return (
    <Box>
      <Flex direction="column" mb={6}>
        <InputGroup mb={4}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </Flex>

      {products.length >= PRODUCT_LIMIT - 5 && products.length < PRODUCT_LIMIT && (
        <Box mb={4} p={3} bg="yellow.100" borderRadius="md">
          <Text color="yellow.800">
            Te estás acercando al límite de productos. Tienes {PRODUCT_LIMIT - products.length} productos disponibles.
          </Text>
        </Box>
      )}
      {products.length >= PRODUCT_LIMIT && (
        <Box mb={4} p={3} bg="red.100" borderRadius="md">
          <Text color="red.800">
            Has alcanzado el límite de productos. Contacta con soporte para aumentar tu límite.
          </Text>
        </Box>
      )}

      {displayedProducts.length === 0 ? (
        <Center flexDirection="column" p={8} bg="gray.50" borderRadius="lg" boxShadow="sm">
          <Icon as={SearchIcon} w={12} h={12} color="gray.400" mb={4} />
          <Heading as="h3" size="md" textAlign="center" mb={2}>
            No se encontraron productos
          </Heading>
          <Text color="gray.600" textAlign="center" maxW="md">
            que coincidan con tu búsqueda. Intenta con otros términos o crea un nuevo producto.
          </Text>
        </Center>
      ) : (
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)"
          }}
          gap={6}
        >
          {products?.map(renderProduct)}
        </Grid>
      )}
      {isLoading && (
        <Center mt={4}>
          <Spinner size="xl" />
        </Center>
      )}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCurrentProduct(null);
        }}
        onSubmit={handleSubmit}
        product={currentProduct}
        isLoading={isLoading}
      />
    </Box>
  );
};

export default ProductManagement;