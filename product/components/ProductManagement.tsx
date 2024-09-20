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

interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string | number;
}

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
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
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
        (product.title?.toLowerCase().includes(lowercasedTerm) ?? false) ||
        (product.description?.toLowerCase().includes(lowercasedTerm) ?? false) ||
        (product.price?.toString().includes(lowercasedTerm) ?? false)
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
    setCurrentProduct({ id: "", title: "", description: "", image: "", price: "" });
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        const response = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete product");
        fetchProducts();
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
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar el producto");
      }
      fetchProducts();
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
      <Heading as="h2" size="lg" mb={4}>
        Gestión de productos
      </Heading>
      <Button colorScheme="green" mb={4} onClick={handleCreate}>
        Crear nuevo producto
      </Button>
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
                ${Number(product.price).toFixed(2)}
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
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        product={currentProduct}
        isLoading={isLoading}
      />
    </Box>
  );
};

export default ProductManagement;