import React, { useState } from "react";
import {
  Box,
  Heading,
  Button,
  Flex,
  Icon,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Center,
  HStack,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Switch,
  Text
} from "@chakra-ui/react";
import ProductManagement from "../product/components/ProductManagement";
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaCog, 
  FaEye, 
  FaPlus, 
  FaTags, 
  FaChevronDown, 
  FaSort, 
  FaBox 
} from 'react-icons/fa';
import ProductModal from '../product/components/ProductModal';
import { Product } from "../product/types";
import { createProduct, updateProduct } from "../utils/googleSheets";
import { CategoryManager } from '../product/components/CategoryManager';
import { useCategories } from '../hooks/useCategories';
import SiteInfoCollapsible from '../components/SiteInfoCollapsible';
import { useSiteInfo } from '../hooks/useSiteInfo';
import ProductOrderManager from '../product/components/ProductOrderManager';

const AdminPage: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const { siteInfo, isLoading: isSiteInfoLoading } = useSiteInfo();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const { categories } = useCategories();
  const [isProductOrderOpen, setIsProductOrderOpen] = useState(false);
  const [showHiddenProducts, setShowHiddenProducts] = useState(true);

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

  const handleCopyLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "¡Enlace copiado!",
        description: "El enlace de la tienda se copió al portapapeles",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }).catch((err) => {
      console.error('Error al copiar:', err);
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar el enlace",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    });
  };

  const handleToggleHiddenProducts = () => {
    setShowHiddenProducts(!showHiddenProducts);
    toast({
      title: showHiddenProducts ? "Mostrando solo productos visibles" : "Mostrando todos los productos",
      description: "El listado se está actualizando...",
      status: "info",
      duration: 2000,
      isClosable: true,
      position: "top",
    });
  };

  return (
    <Box 
      margin="auto" 
      maxWidth="1200px" 
      padding={4}
      pt="90px"
    >
      {isSiteInfoLoading ? (
        <Box p={4} borderRadius="md" boxShadow="sm">
          <Center>
            <HStack spacing={4} align="center">
              <SkeletonCircle size="50px" />
              <Skeleton height="24px" width="200px" />
            </HStack>
          </Center>
        </Box>
      ) : (
        <SiteInfoCollapsible 
          siteInfo={siteInfo}
          onCopyLink={handleCopyLink}
        />
      )}
      
      <Flex
        direction={{ base: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ base: "stretch", md: "center" }}
        mb={8}
        mt={8}
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
            colorScheme="gray"
            width={{ base: "full", sm: "auto" }}
            leftIcon={<Icon as={FaCog} />}
            onClick={handleStoreSettings}
          >
            Ir a la configuración
          </Button>
          <Button
            colorScheme="blue"
            width={{ base: "full", sm: "auto" }}
            leftIcon={<Icon as={FaPlus} />}
            onClick={handleCreateProduct}
          >
            Crear nuevo producto
          </Button>
          <Menu closeOnSelect={false}>
            <MenuButton
              as={Button}
              rightIcon={<FaChevronDown />}
              colorScheme="purple"
              width={{ base: "full", sm: "auto" }}
            >
              Ver más
            </MenuButton>
            <MenuList zIndex={10}>
              <MenuItem 
                icon={<Icon as={FaEye} />}
                onClick={() => {
                  router.push('/', undefined, { 
                    shallow: true, 
                    scroll: false 
                  });
                }}
              >
                Previsualizar tienda
              </MenuItem>
              <MenuItem 
                icon={<Icon as={FaTags} />}
                onClick={() => setIsCategoryManagerOpen(true)}
              >
                Gestionar Categorías
              </MenuItem>
              <MenuItem 
                icon={<Icon as={FaSort} />}
                onClick={() => setIsProductOrderOpen(true)}
              >
                Orden de productos
              </MenuItem>
              <MenuItem 
                icon={<Icon as={FaBox} />}
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Flex justify="space-between" align="center" width="100%">
                  <Text>Ver productos ocultos</Text>
                  <Switch 
                    isChecked={showHiddenProducts}
                    onChange={handleToggleHiddenProducts}
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </Flex>
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      <ProductManagement onCreateProduct={handleCreateProduct} showHiddenProducts={showHiddenProducts} />

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
        modalProps={{ 
          zIndex: 2000, 
        }}
      />

      <ProductOrderManager
        isOpen={isProductOrderOpen}
        onClose={() => setIsProductOrderOpen(false)}
        modalProps={{ 
          zIndex: 2000, 
        }}
      />
    </Box>
  );
};

export default AdminPage;