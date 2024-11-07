import React, { useState } from "react";
import {
  Box,
  Heading,
  Button,
  Flex,
  Icon,
  useToast,
} from "@chakra-ui/react";
import ProductManagement from "../product/components/ProductManagement";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaArrowRight, FaEye, FaPlus, FaList } from 'react-icons/fa';
import ProductModal from '../product/components/ProductModal';
import { Product } from "../product/types";
import { createProduct, updateProduct } from "../utils/googleSheets";
import { CategoryManager } from '../product/components/CategoryManager';
import { useCategories } from '../hooks/useCategories';

const AdminPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const { categories } = useCategories();

  const handleStoreSettings = () => {
    router.push('/store-config');
  };

  const handleCreateProduct = () => {
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
      <Box display={{ base: 'block', md: 'none' }} mb={4}>
        <Button
          colorScheme="gray"
          onClick={handleStoreSettings}
          width="full"
          rightIcon={<Icon as={FaArrowRight} />}
        >
          Ir a la configuración de la tienda
        </Button>
      </Box>

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
          <Link href="/?preview=true" passHref>
            <Button
              as="a"
              colorScheme="green"
              width={{ base: "full", sm: "auto" }}
              leftIcon={<Icon as={FaEye} />}
            >
              Previsualizar tienda
            </Button>
          </Link>
          <Button
            colorScheme="blue"
            width={{ base: "full", sm: "auto" }}
            leftIcon={<Icon as={FaPlus} />}
            onClick={handleCreateProduct}
          >
            Crear nuevo producto
          </Button>
          <Button
            colorScheme="purple"
            width={{ base: "full", sm: "auto" }}
            leftIcon={<Icon as={FaList} />}
            onClick={() => setIsCategoryManagerOpen(true)}
          >
            Gestionar Categorías
          </Button>
          <Button
            display={{ base: 'none', md: 'flex' }}
            colorScheme="gray"
            onClick={handleStoreSettings}
            width={{ base: "full", sm: "auto" }}
            rightIcon={<Icon as={FaArrowRight} />}
          >
            Ir a la configuración de la tienda
          </Button>
        </Flex>
      </Flex>

      <ProductManagement onCreateProduct={handleCreateProduct} />

      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          product={null}
          isLoading={isLoading}
        />
      )}

      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />
    </Box>
  );
};

export default AdminPage;
