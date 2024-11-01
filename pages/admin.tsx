import React, { useState } from "react";
import {
  Box,
  Heading,
  Button,
  Flex,
  Icon,
  useToast,
  InputGroup,
  Input,
  InputLeftElement,
  Select,
  Center,
  Spinner,
} from "@chakra-ui/react";
import ProductManagement from "../product/components/ProductManagement";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaArrowRight, FaStore, FaPlus, FaList, FaEye } from 'react-icons/fa';
import ProductModal from '../product/components/ProductModal';
import { Product } from "../product/types";
import { createProduct, updateProduct } from "../utils/googleSheets";
import { Category } from "../product/types";
import { getCategories } from "../utils/googleSheets";
import useSWR from 'swr';
import { SearchIcon } from "@chakra-ui/icons";
import { CategoryManager } from '../product/components/CategoryManager';

const AdminPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const { data: categories = [] } = useSWR<Category[]>('/api/categories');

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
      <Flex
        direction="column"
        gap={4}
      >
        <Box display={{ base: 'block', md: 'none' }}>
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
          gap={4}
        >
          <Heading as="h1" size="xl">
            Gestión de productos
          </Heading>

          <Flex
            direction={{ base: "column", sm: "row" }}
            gap={4}
            flexWrap={{ sm: "wrap", md: "nowrap" }}
          >
            <Link 
              href={{ 
                pathname: "/",
                query: { preview: "true" } 
              }} 
              passHref
            >
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
              onClick={() => setIsCategoryManagerOpen(true)}
              leftIcon={<Icon as={FaList} />}
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

        <Flex 
          direction={{ base: "column", md: "row" }} 
          gap={4}
        >
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={SearchIcon} color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Select
            placeholder="Todas las categorías"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Flex>

        <Box mt={4}>
          <ProductManagement 
            onCreateProduct={handleCreateProduct} 
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
          />
        </Box>
      </Flex>

      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          product={null}
          isLoading={isLoading}
          categories={categories || []}
        />
      )}
      {isCategoryManagerOpen && (
        <CategoryManager
          isOpen={isCategoryManagerOpen}
          onClose={() => setIsCategoryManagerOpen(false)}
        />
      )}
    </Box>
  );
};

export default AdminPage;
