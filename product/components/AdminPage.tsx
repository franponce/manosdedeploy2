import React, { useState } from "react";
import {
  Box,
  Heading,
  VStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Button,
  Flex,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { FaArrowRight, FaStore, FaPlus } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProductManagement from "./ProductManagement";
import CustomScripts from "./CustomScripts";
import ProductModal from "./ProductModal";
import { Product } from "../types";
import { createProduct, updateProduct } from "../../utils/googleSheets";

const AdminPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

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
    <Box margin="auto" maxWidth="1200px" padding={8}>
      <Heading as="h1" mb={8} size="xl">
        Panel de administración
      </Heading>

      <Flex
        direction={{ base: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ base: "stretch", md: "center" }}
        mb={8}
        gap={4}
      >
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
          Ir a la configuración de la tienda
        </Button>
      </Flex>

      <VStack spacing={8} align="stretch">
        <Accordion allowMultiple defaultIndex={[0]}>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading as="h2" size="lg">
                    Gestión de productos
                  </Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <ProductManagement onCreateProduct={handleCreateProduct} />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading as="h2" size="lg">
                    Scripts personalizados
                  </Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <CustomScripts />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>

      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          product={null}
          isLoading={isLoading}
        />
      )}
    </Box>
  );
};

export default AdminPage;