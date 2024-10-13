import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Heading,
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
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { FaStore, FaArrowRight } from "react-icons/fa";
import ProductModal from "./ProductModal";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../../utils/googleSheets";
import { Product } from "../types";
import NextLink from "next/link";

const PRODUCT_LIMIT = 30;
const SYNC_INTERVAL = 30000; // 30 segundos

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

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
  }, [searchTerm, products]);

  const handleCreate = () => {
    if (products.length >= PRODUCT_LIMIT) {
      toast({
        title: "Límite alcanzado",
        description: `Has alcanzado el límite de ${PRODUCT_LIMIT} productos. Contacta con soporte para aumentar tu límite.`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setCurrentProduct(null);
    setIsModalOpen(true);
  };

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
      await fetchProducts();
      setIsModalOpen(false);
      setCurrentProduct(null);
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

  return (
    <Box>
      <Flex direction={{ base: "column", md: "row" }} justifyContent="space-between" alignItems="center" mb={8}>
        <Heading as="h1" size="xl" mb={{ base: 4, md: 0 }}>
          Gestión de productos
        </Heading>
        <HStack spacing={4}>
          <NextLink href="/" passHref>
            <Button as="a" leftIcon={<Icon as={FaStore} />} colorScheme="green">
              Ir a la tienda
            </Button>
          </NextLink>
          <Button onClick={handleCreate} colorScheme="blue">
            Crear nuevo producto
          </Button>
          <NextLink href="/store-config" passHref>
            <Button as="a" rightIcon={<Icon as={FaArrowRight} />} colorScheme="gray">
              Ir a la configuración de la tienda
            </Button>
          </NextLink>
        </HStack>
      </Flex>

      <InputGroup mb={6}>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.300" />
        </InputLeftElement>
        <Input
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

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

      {filteredProducts.length === 0 ? (
        <Center flexDirection="column" p={8} bg="gray.50" borderRadius="lg" boxShadow="sm">
          <Icon as={SearchIcon} w={12} h={12} color="gray.400" mb={4} />
          <Heading as="h3" size="md" textAlign="center" mb={2}>
            No se encontraron productos
          </Heading>
          <Text color="gray.600" textAlign="center" maxW="md">
            No hay productos que coincidan con tu búsqueda. Intenta con otros términos o crea un nuevo producto.
          </Text>
          <Button mt={4} colorScheme="blue" onClick={handleCreate}>
            Crear nuevo producto
          </Button>
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {filteredProducts.map((product) => (
            <Box key={product.id} borderRadius="lg" borderWidth={1} overflow="hidden">
              <AspectRatio ratio={1}>
                <Image
                  src={product.image}
                  alt={product.title}
                  objectFit="cover"
                />
              </AspectRatio>
              <Box p={4}>
                <Heading as="h3" size="md" noOfLines={2} mb={2}>
                  {product.title}
                </Heading>
                <Text noOfLines={3} mb={2}>{product.description}</Text>
                <Text fontWeight="bold" mb={4}>
                  ${product.price.toFixed(2)}
                </Text>
                <HStack spacing={4}>
                  <Button colorScheme="blue" onClick={() => handleEdit(product)}>
                    Editar
                  </Button>
                  <Button colorScheme="red" onClick={() => handleDelete(product.id)}>
                    Eliminar
                  </Button>
                </HStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
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