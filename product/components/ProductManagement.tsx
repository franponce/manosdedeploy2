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
} from "@chakra-ui/react";
import ProductModal from "./ProductModal";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../../utils/googleSheets";
import { Product } from "../types";

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
      <Input
        mb={4}
        placeholder="Buscar productos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {products.length >= PRODUCT_LIMIT - 5 && products.length < PRODUCT_LIMIT && (
        <Text color="orange.500" mb={4}>
          Te estás acercando al límite de productos. Tenés {PRODUCT_LIMIT - products.length} productos disponibles.
        </Text>
      )}
      {products.length >= PRODUCT_LIMIT && (
        <Text color="red.500" mb={4}>
          Has alcanzado el límite de productos. Contacta con soporte para aumentar tu límite.
        </Text>
      )}
      <Button onClick={handleCreate} colorScheme="blue" mb={4}>
        Crear nuevo producto
      </Button>
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
