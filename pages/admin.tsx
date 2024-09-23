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

interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string | number;
}

const PRODUCT_LIMIT = 100; // Ajusta este número según tus necesidades

const AdminPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [products, setProducts] = useState<Product[]>([]); // Asegúrate de cargar los productos reales aquí
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    onOpen();
  };

  const handleStoreSettings = () => {
    router.push('/store-config');
  };

  const handleSubmit = async (product: Product) => {
    setIsLoading(true);
    try {
      // Aquí iría la lógica para guardar el producto en tu backend
      console.log("Guardando producto:", product);
      
      // Simulando una operación asíncrona
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProducts([...products, { ...product, id: Date.now().toString() }]);
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