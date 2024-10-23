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
} from "@chakra-ui/react";
import ProductManagement from "../components/ProductManagement";
import CustomScripts from "../components/CustomScripts";
import ProductModal from "./ProductModal";
import { Product } from "../types";
import { createProduct, updateProduct } from "../../utils/googleSheets";

const AdminPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);

  const handleCreateProduct = () => {
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
      // Aquí podrías añadir un toast de éxito si lo deseas
    } catch (error) {
      console.error("Error saving product:", error);
      // Aquí podrías añadir un toast de error si lo deseas
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box margin="auto" maxWidth="1200px" padding={8}>
      <Heading as="h1" mb={8} size="xl">
        Panel de administración
      </Heading>

      <VStack spacing={8} align="stretch">
        <Accordion allowMultiple>
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
              <ProductManagement 
                onCreateProduct={handleCreateProduct} 
                onEditProduct={handleEditProduct}
              />
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
          product={currentProduct}
          isLoading={isLoading}
        />
      )}
    </Box>
  );
};

export default AdminPage;
