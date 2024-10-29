import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Table,
  Select,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { FaTrash } from "react-icons/fa";
import ProductModal from "./ProductModal";
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from "../../utils/googleSheets";
import { Product, Category } from "../types";
import useSWR, { mutate } from 'swr';

const PRODUCT_LIMIT = 30;
const SYNC_INTERVAL = 30000; // 30 segundos

interface ProductManagementProps {
  onCreateProduct: () => void;
  searchTerm: string;
  selectedCategory: string;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ 
  onCreateProduct, 
  searchTerm, 
  selectedCategory 
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{ [key: string]: boolean }>({});
  const observer = useRef<IntersectionObserver | null>(null);

  // Efecto para filtrar productos basado en búsqueda y categoría
  useEffect(() => {
    const filtered = products.filter(product => {
      const matchesSearch = 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.price.toString().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    
    setDisplayedProducts(filtered);
    setPage(1);
    setHasMore(true);
  }, [searchTerm, selectedCategory, products]);

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
          >
            📦
          </Box>
          <Heading as="h3" size="md" textAlign="center" mb={2}>
            Aún no hay productos en esta categoría
          </Heading>
          <Text color="gray.600" textAlign="center" maxW="md">
            Puedes crear nuevos productos usando el botón "Crear nuevo producto"
          </Text>
        </Center>
      );
    }
    
    return (
      <Center flexDirection="column" p={8} bg="gray.50" borderRadius="lg" boxShadow="sm">
        <Box 
          as="span" 
          fontSize="6xl" 
          mb={4} 
          role="img" 
          aria-label="Buscando"
        >
          🔍
        </Box>
        <Heading as="h3" size="md" textAlign="center" mb={2}>
          No se encontraron productos
        </Heading>
        <Text color="gray.600" textAlign="center" maxW="md">
          que coincidan con tu búsqueda. Intenta con otros términos o categorías.
        </Text>
      </Center>
    );
  };

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

  const toast = useToast();

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchProducts = useCallback(async () => {
    try {
      const fetchedProducts = await getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
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

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      return;
    }

    setIsLoading(true);
    try {
      // Obtener el índice del producto considerando que empieza en A2
      const index = (products || []).findIndex(p => p.id === productId);
      if (index === -1) {
        throw new Error('Producto no encontrado');
      }

      // Calcular el ID de la fila en el sheet (A2 = 2, A3 = 3, etc.)
      const sheetRowId = (index + 2).toString();
      
      console.log(`Eliminando producto en fila ${sheetRowId}`); // Para debugging
      await deleteProduct(sheetRowId);

      // Actualizar el estado local y la caché
      const updatedProducts = products?.filter(p => p.id !== productId) || [];
      setProducts(updatedProducts);
      
      // Invalidar la caché de SWR para forzar una recarga
      await mutate('/api/products');

      toast({
        title: "Producto eliminado",
        description: "El producto ha sido eliminado exitosamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error al eliminar producto:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto. Por favor, intenta nuevamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
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
      
      // Actualizar la caché de SWR con el nuevo producto
      mutate('/api/products', async (currentData: any) => {
        const updatedProducts = currentData ? [...currentData, product] : [product];
        return updatedProducts;
      }, false);

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

  const isProductScheduled = (product: Product) => {
    return product.isScheduled && product.scheduledPublishDate && new Date(product.scheduledPublishDate) > new Date();
  };

  const [expandedTitles, setExpandedTitles] = useState<{ [key: string]: boolean }>({});

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

  return (
    <Box>
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

      {isLoading ? (
        <Center p={8}>
          <Spinner size="xl" />
        </Center>
      ) : displayedProducts.length ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {displayedProducts.map((product, index) => (
            <Box
              key={product.id}
              ref={index === displayedProducts.length - 1 ? lastProductElementRef : null}
              borderRadius="lg"
              borderWidth={1}
              overflow="hidden"
              position="relative"
            >
              {isProductScheduled(product) && (
                <Badge 
                  colorScheme="purple" 
                  position="absolute" 
                  top="2" 
                  left="2" 
                  zIndex="1"
                >
                  Producto programado
                </Badge>
              )}
              <AspectRatio ratio={1}>
                <Image
                  src={product.image}
                  alt={product.title}
                  objectFit="cover"
                />
              </AspectRatio>
              <Box p={4}>
                <Box mb={2}>
                  <Text
                    fontWeight="bold"
                    fontSize="lg"
                    noOfLines={expandedTitles[product.id] ? undefined : 2}
                    onClick={() => toggleTitle(product.id)}
                    cursor="pointer"
                  >
                    {product.title}
                  </Text>
                  {product.title.length > 50 && (
                    <Button
                      size="xs"
                      variant="link"
                      color="blue.500"
                      onClick={() => toggleTitle(product.id)}
                      mt={1}
                    >
                      {expandedTitles[product.id] ? "Ver menos" : "Ver título completo"}
                    </Button>
                  )}
                </Box>
                <Box mb={2}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: expandedDescriptions[product.id]
                        ? product.description
                        : truncateText(product.description, 150)
                    }}
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: expandedDescriptions[product.id] ? 'unset' : 3,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.5em',
                      maxHeight: expandedDescriptions[product.id] ? 'none' : '4.5em',
                    }}
                  />
                  {product.description.length > 150 && (
                    <Button
                      size="xs"
                      variant="link"
                      color="blue.500"
                      onClick={() => toggleDescription(product.id)}
                      mt={1}
                    >
                      {expandedDescriptions[product.id] ? "Ver menos" : "Ver más"}
                    </Button>
                  )}
                </Box>
                <Text fontWeight="bold" mb={4}>
                  ${product.price.toFixed(2)}
                </Text>
                <HStack spacing={4}>
                  <Button 
                    colorScheme="red" 
                    onClick={() => handleDelete(product.id)}
                    leftIcon={<Icon as={FaTrash} />}
                  >
                    Eliminar
                  </Button>
                  <Button colorScheme="blue" onClick={() => handleEdit(product)}>
                    Editar
                  </Button>
                </HStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      ) : (
        <NoProductsFound />
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
        categories={categories}
      />
    </Box>
  );
};

export default ProductManagement;
