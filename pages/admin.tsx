import React, { useState } from "react";
import {
  Box,
  Heading,
  Button,
  Flex,
  VStack,
  Icon,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import ProductManagement from "../product/components/ProductManagement";
import ProductModal from "../product/components/ProductModal";
import { useRouter } from 'next/router';
import { FaArrowRight } from 'react-icons/fa';
import { Product } from "../product/types";

const AdminPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = () => {
    setCurrentProduct({ id: "", title: "", description: "", image: "", price: 0 });
    onOpen();
  };

  const handleStoreSettings = () => {
    router.push('/store-config');
  };

  const handleSubmit = async (product: Omit<Product, 'price'> & { price: string | number }) => {
    setIsLoading(true);
    try {
      // Aquí iría la lógica para guardar el producto en tu backend
      console.log("Guardando producto:", product);
      
      // Simulando una operación asíncrona
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newProduct: Product = {
        ...product,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price
      };

      // Actualiza el estado o realiza otras operaciones necesarias
      // setProducts([...products, newProduct]);
      
      toast({
        title: "Producto creado",
        description: "El producto se ha creado exitosamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error("Error al guardar el producto:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto. Por favor, intenta de nuevo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box margin="auto" maxWidth="1200px" padding={4}>
      <Flex
        direction={{ base: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ base: "stretch", md: "center" }}
        mb={8}
        gap={4}
      >
        <Heading as="h1" size="xl" mb={{ base: 4, md: 0 }}>
          Gestión de productos
        </Heading>
        <Flex
          direction={{ base: "column", sm: "row" }}
          gap={4}
        >
          <Button
            colorScheme="blue"
            onClick={handleCreate}
            width={{ base: "full", sm: "auto" }}
          >
            Crear nuevo producto
          </Button>
          <Button
            colorScheme="gray"
            onClick={handleStoreSettings}
            width={{ base: "full", sm: "auto" }}
            rightIcon={<Icon as={FaArrowRight} />}
          >
            Ir a la configuración de la tienda
          </Button>
        </Flex>
      </Flex>

      <VStack spacing={8} align="stretch">
        <ProductManagement />
      </VStack>

      <ProductModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        product={currentProduct}
        isLoading={isLoading}
      />
    </Box>
  );
};

export default AdminPage;