import React from "react";
import {
  Box,
  Heading,
  Button,
  Flex,
  VStack,
} from "@chakra-ui/react";
import ProductManagement from "../product/components/ProductManagement";
import { useRouter } from 'next/router';

const AdminPage: React.FC = () => {
  const router = useRouter();

  const handleCreateProduct = () => {
    // Implementar la lógica para crear un nuevo producto
    console.log("Crear nuevo producto");
  };

  const handleStoreSettings = () => {
    router.push('/store-config');
  };

  return (
    <Box margin="auto" maxWidth="1200px" padding={8}>
      <Flex justifyContent="space-between" alignItems="center" mb={8}>
        <Heading as="h1" size="xl">
          Gestión de productos
        </Heading>
        <Flex>
          <Button colorScheme="blue" onClick={handleCreateProduct} mr={4}>
            Crear nuevo producto
          </Button>
          <Button colorScheme="gray" onClick={handleStoreSettings}>
            Configuración de la tienda
          </Button>
        </Flex>
      </Flex>

      <VStack spacing={8} align="stretch">
        <ProductManagement />
      </VStack>
    </Box>
  );
};

export default AdminPage;