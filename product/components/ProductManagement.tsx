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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
import { useStock } from '../../hooks/useStock';
import { WarningIcon } from "@chakra-ui/icons";
import AdminProductCard from './AdminProductCard';
import { unifiedStockService } from '../../services/unifiedStockService';

const PRODUCT_LIMIT = 30;
const SYNC_INTERVAL = 30000; // 30 segundos

interface ProductManagementProps {
  onCreateProduct: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({
  onCreateProduct
}) => {
  const { data: products, error, isLoading } = useSWR<Product[]>(
    SWR_KEYS.PRODUCTS,
    () => getProducts(),
    {
      refreshInterval: SYNC_INTERVAL,
      revalidateOnFocus: false,
    }
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const toast = useToast();
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [productImageIndexes, setProductImageIndexes] = useState<{ [key: string]: number }>({});
  const [showHiddenProducts, setShowHiddenProducts] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toastIdRef = useRef<string | number>();

  // Definir todos los callbacks y efectos primero
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

  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = products?.filter(
      (product) =>
        product.title.toLowerCase().includes(lowercasedTerm) ||
        product.description.toLowerCase().includes(lowercasedTerm) ||
        product.price.toString().includes(lowercasedTerm)
    ) || [];
    setDisplayedProducts(filtered);
    setPage(1);
    setHasMore(true);
  }, [searchTerm, products]);

  useEffect(() => {
    const PRODUCTS_PER_PAGE = 10;
    setDisplayedProducts(products?.slice(0, page * PRODUCTS_PER_PAGE) || []);
    setHasMore(page * PRODUCTS_PER_PAGE < (products?.length || 0));
  }, [products, page]);

  useEffect(() => {
    if (!products) return;

    const filtered = products.filter(product => {
      if (showHiddenProducts) {
        return true;
      }
      return product.isVisible;
    }).filter(product => {
      const matchesSearch = !searchTerm ||
        product.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory ||
        product.categoryId === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    setDisplayedProducts(filtered);
  }, [products, searchTerm, selectedCategory, showHiddenProducts]);

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      setDeletingProductId(productToDelete.id);
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete product');
      }

      toast({
        title: "Producto eliminado",
        description: "El producto se eliminó correctamente",
        status: "success",
        duration: 3000,
      });
      
      mutate(SWR_KEYS.PRODUCTS);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: error?.message || "No se pudo eliminar el producto",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
      setDeletingProductId(null);
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    try {
      const updatedProduct = {
        ...product,
        isVisible: !product.isVisible
      };
      await updateProduct(updatedProduct);
      await getProducts();

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
    const isEditing = Boolean(product.id);
    try {
      setIsSubmitting(true);
      const toastId = toast({
        title: isEditing ? "Actualizando producto" : "Creando nuevo producto",
        description: "Guardando los cambios...",
        status: "info",
        duration: null,
        isClosable: false,
        position: "bottom",
      });

      // Actualizar stock usando el nuevo servicio
      await unifiedStockService.updateStock(
        product.id, 
        parseInt(product.stock.toString(), 10) || 0
      );

      let updatedProduct;
      if (isEditing) {
        await updateProduct(product);
        updatedProduct = product;
      } else {
        const newId = await createProduct(product);
        updatedProduct = { ...product, id: newId };
      }

      setIsModalOpen(false);
      setCurrentProduct(null);

      // Cerrar el toast de "procesando"
      toast.close(toastId);

      // Actualizar caché SWR
      await mutate(
        SWR_KEYS.PRODUCTS,
        (currentProducts: Product[] = []) => {
          if (isEditing) {
            return currentProducts.map(p => p.id === product.id ? updatedProduct : p);
          } else {
            return [updatedProduct, ...currentProducts];
          }
        },
        false
      );

      const successToastId = toast({
        title: isEditing ? "¡Cambios guardados!" : "¡Producto creado exitosamente!",
        description: isEditing 
          ? "El producto se actualizó correctamente."
          : "El producto aparecerá en el catálogo en los próximos minutos.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });

      if (!isEditing) {
        // Para nuevos productos, forzar actualización después de 3 segundos
        setTimeout(() => {
          mutate(SWR_KEYS.PRODUCTS);
          // Cerrar el toast de éxito después de la actualización
          setTimeout(() => {
            toast.close(successToastId);
          }, 2000);
        }, 3000);
      }

    } catch (error) {
      toast({
        title: isEditing ? "Error al actualizar" : "Error al crear producto",
        description: isEditing
          ? "No se pudieron guardar los cambios. Por favor, intenta nuevamente."
          : "No se pudo crear el producto. Verifica la información e intenta nuevamente.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setIsSubmitting(false);
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
    if (!products) return;
    
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
      await getProducts(); // Actualizar la lista después de los cambios
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

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const renderProduct = (product: Product) => {
    const { available, isLoading: stockLoading } = useStock(product.id);
    
    return (
      <Box
        key={product.id}
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg="white"
        position="relative"
      >
        <Box position="relative" width="100%" paddingTop="100%">
          <Box position="absolute" top={0} left={0} right={0} bottom={0}>
            <Image
              src={product.images[productImageIndexes[product.id] || 0]}
              alt={product.title}
              objectFit="cover"
              width="100%"
              height="100%"
            />
            {product.images.length > 1 && (
              <>
                <IconButton
                  aria-label="Anterior"
                  icon={<ChevronLeftIcon />}
                  position="absolute"
                  left={2}
                  top="50%"
                  transform="translateY(-50%)"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProductImageIndexes(prev => ({
                      ...prev,
                      [product.id]: prev[product.id] === 0 ? product.images.length - 1 : (prev[product.id] || 0) - 1
                    }));
                  }}
                  zIndex={2}
                />
                <IconButton
                  aria-label="Siguiente"
                  icon={<ChevronRightIcon />}
                  position="absolute"
                  right={2}
                  top="50%"
                  transform="translateY(-50%)"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProductImageIndexes(prev => ({
                      ...prev,
                      [product.id]: prev[product.id] === product.images.length - 1 ? 0 : (prev[product.id] || 0) + 1
                    }));
                  }}
                  zIndex={2}
                />
              </>
            )}
          </Box>
        </Box>

        <Box p={4} flex="1" display="flex" flexDirection="column">
          <Flex justify="space-between" align="center" mb={3}>
            <Badge
              width="fit-content"
              px={3}
              py={1}
              borderRadius="full"
              colorScheme={product.isVisible ? "green" : "red"}
              fontSize="sm"
            >
              {product.isVisible ? "Visible" : "Oculto"}
            </Badge>
            
            <Badge
              width="fit-content"
              px={3}
              py={1}
              borderRadius="full"
              colorScheme={stockLoading ? "gray" : available === 0 ? "red" : available <= 5 ? "orange" : "green"}
              fontSize="sm"
            >
              {stockLoading ? (
                "Cargando..."
              ) : available === 0 ? (
                <HStack spacing={1} alignItems="center">
                  <WarningIcon boxSize="12px" />
                  <Text>Sin stock</Text>
                </HStack>
              ) : (
                `Stock: ${available}`
              )}
            </Badge>
          </Flex>

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

          <Box mb={4} flex="1">
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

          <Box width="100%" p={4}>
            <HStack spacing={4} width="100%">
              <Button
                flex={1}
                size="lg"
                colorScheme="red"
                onClick={() => handleDeleteProduct(product)}
                leftIcon={<Icon as={FaTrash} />}
                borderRadius="md"
              >
                Eliminar
              </Button>
              <Button
                flex={1}
                size="lg"
                colorScheme="blue"
                onClick={() => handleEdit(product)}
                borderRadius="md"
              >
                Editar
              </Button>
            </HStack>
          </Box>
        </Box>
      </Box>
    );
  };

  const filteredProducts = useMemo(() => {
    console.log('Filtering products. showHiddenProducts:', showHiddenProducts);
    if (!products) return [];

    return products.filter(product => {
      const matchesSearch = !searchTerm ||
        product.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory ||
        product.categoryId === selectedCategory;

      const matchesVisibility = showHiddenProducts || product.isVisible;

      return matchesSearch && matchesCategory && matchesVisibility;
    });
  }, [products, showHiddenProducts, searchTerm, selectedCategory]);

  // Renderizado condicional al final
  if (isLoading || !products) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            size="xl"
          />
          <Text color="gray.600">
            Cargando productos...
          </Text>
        </VStack>
      </Center>
    );
  }

  // Renderizado principal
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
        <Flex justifyContent="flex-end">
          <HStack>
            <Text>Ver productos ocultos</Text>
            <Switch
              isChecked={showHiddenProducts}
              onChange={() => setShowHiddenProducts(!showHiddenProducts)}
              colorScheme="purple"
            />
          </HStack>
        </Flex>
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

      {isLoading ? (
        <Center py={10}>
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text fontSize="lg">Cargando productos...</Text>
          </VStack>
        </Center>
      ) : (
        filteredProducts.length === 0 ? (
          <Center flexDirection="column" p={8} bg="gray.50" borderRadius="lg" boxShadow="sm">
            <Icon as={SearchIcon} w={12} h={12} color="gray.400" mb={4} />
            <Heading as="h3" size="md" textAlign="center" mb={2}>
              No se encontraron productos.
            </Heading>
            <Text color="gray.600" textAlign="center" maxW="md">
              Intenta con otros términos o crea un nuevo producto.
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
        ) : (
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)"
            }}
            gap={6}
          >
            {filteredProducts.map((product) => (
              <AdminProductCard 
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDeleteProduct}
                productImageIndex={0}
                onImageIndexChange={(productId, newIndex) => {
                  // Implementar lógica de cambio de imagen
                } } isDeleting={false}              />
            ))}
          </Grid>
        )
      )}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsModalOpen(false);
            setCurrentProduct(null);
          }
        }}
        onSubmit={handleSubmit}
        product={currentProduct}
        isLoading={isSubmitting}
      />
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize='lg' fontWeight='bold'>
              Eliminar Producto
            </AlertDialogHeader>

            <AlertDialogBody>
              ¿Estás seguro? Esta acción es irreversible y el producto será eliminado permanentemente.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button colorScheme='red' onClick={handleDeleteConfirm} ml={3}>
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default ProductManagement;
