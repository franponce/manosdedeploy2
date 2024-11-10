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
  Checkbox,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { FaTrash } from "react-icons/fa";
import ProductModal from "./ProductModal";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  toggleProductVisibility
} from "../../utils/googleSheets";
import { Product, Category } from "../types";
import useSWR, { mutate } from 'swr';

const PRODUCT_LIMIT = 30;
const SYNC_INTERVAL = 30000; // 30 segundos

const ProductManagement: React.FC<{ onCreateProduct: () => void }> = ({ onCreateProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
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

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

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
      setFilteredProducts(fetchedProducts);
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
    const PRODUCTS_PER_PAGE = 10; // Definir PRODUCTS_PER_PAGE como una constante
    setDisplayedProducts(filteredProducts.slice(0, page * PRODUCTS_PER_PAGE));
    setHasMore(page * PRODUCTS_PER_PAGE < filteredProducts.length);
  }, [filteredProducts, page]);

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
          description: "Failed to delete product",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
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

  const handleToggleVisibility = async (hide: boolean) => {
    try {
      await toggleProductVisibility(selectedProducts, hide);
      toast({
        title: "Éxito",
        description: `Productos ${hide ? 'ocultados' : 'mostrados'} exitosamente`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Recargar los productos
      mutate('/api/products');
      
      // Limpiar selección
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar la visibilidad de los productos",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

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
              <Checkbox
                position="absolute"
                top={2}
                right={2}
                zIndex={1}
                isChecked={selectedProducts.includes(product.id)}
                onChange={() => handleProductSelect(product.id)}
              />
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
              {product.isHidden && (
                <Badge 
                  colorScheme="red" 
                  position="absolute" 
                  top="2" 
                  left="2" 
                  zIndex="1"
                >
                  Oculto
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
      {selectedProducts.length > 0 && (
        <Flex mb={4} gap={2}>
          <Button
            colorScheme="blue"
            onClick={() => handleToggleVisibility(true)}
          >
            Ocultar seleccionados ({selectedProducts.length})
          </Button>
          <Button
            colorScheme="green"
            onClick={() => handleToggleVisibility(false)}
          >
            Mostrar seleccionados ({selectedProducts.length})
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default ProductManagement;
