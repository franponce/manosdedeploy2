import React, { useState } from "react";
import {
  Box,
  Heading,
  Button,
  Flex,
  Icon,
  useToast,
  VStack,
  HStack,
  useBreakpointValue,
} from "@chakra-ui/react";
import ProductManagement from "../product/components/ProductManagement";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaArrowRight, FaStore, FaPlus } from 'react-icons/fa';
import ProductModal from '../product/components/ProductModal';
import { Product } from "../product/types";
import { createProduct, updateProduct } from "../utils/googleSheets";

const AdminPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleStoreSettings = () => {
    router.push('/store-config');
  };

  const handleCreateProduct = () => {
    setCurrentProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
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
    <Box margin="auto" maxWidth="1200px" padding={4}>
      <VStack spacing={4} align="stretch">
        <Heading as="h1" size="xl">
          Gestión de productos
        </Heading>
        
        {isMobile ? (
          <VStack spacing={2} width="100%">
            <Link href="/" passHref>
              <Button
                as="a"
                colorScheme="green"
                width="100%"
                leftIcon={<Icon as={FaStore} />}
              >
                Ir a la tienda
              </Button>
            </Link>
            <Button
              colorScheme="blue"
              width="100%"
              leftIcon={<Icon as={FaPlus} />}
              onClick={handleCreateProduct}
            >
              Crear nuevo producto
            </Button>
            <Button
              colorScheme="gray"
              width="100%"
              onClick={handleStoreSettings}
              rightIcon={<Icon as={FaArrowRight} />}
            >
              Configuración de la tienda
            </Button>
          </VStack>
        ) : (
          <HStack spacing={4} justifyContent="flex-end">
            <Link href="/" passHref>
              <Button
                as="a"
                colorScheme="green"
                leftIcon={<Icon as={FaStore} />}
              >
                Ir a la tienda
              </Button>
            </Link>
            <Button
              colorScheme="blue"
              leftIcon={<Icon as={FaPlus} />}
              onClick={handleCreateProduct}
            >
              Crear nuevo producto
            </Button>
            <Button
              colorScheme="gray"
              onClick={handleStoreSettings}
              rightIcon={<Icon as={FaArrowRight} />}
            >
              Configuración de la tienda
            </Button>
          </HStack>
        )}

        <ProductManagement 
          onCreateProduct={handleCreateProduct} 
          onEditProduct={handleEditProduct}
        />

        {isModalOpen && (
          <ProductModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmit}
            product={currentProduct}
            isLoading={isLoading}
          />
        )}
      </VStack>
    </Box>
  );
};

export default AdminPage;
