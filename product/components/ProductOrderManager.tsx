import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Box,
  Image,
  Text,
  useToast,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import useSWR, { mutate } from 'swr';
import { Product } from '../types';
import { SWR_KEYS } from '../constants';
import { updateProductOrder } from '../../utils/googleSheets';

interface ProductOrderManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductOrderManager: React.FC<ProductOrderManagerProps> = ({ isOpen, onClose }) => {
  const toast = useToast();
  const { data: products } = useSWR<Product[]>(SWR_KEYS.PRODUCTS);
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (products) {
      setOrderedProducts([...products]);
    }
  }, [products]);

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newProducts = [...orderedProducts];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < newProducts.length) {
      // Intercambiar productos
      [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];
      setOrderedProducts(newProducts);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProductOrder(orderedProducts.map(p => p.id));
      await mutate(SWR_KEYS.PRODUCTS, orderedProducts, false);
      
      toast({
        title: "Orden actualizado",
        description: "El orden de los productos se ha guardado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el orden de los productos",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>Ordenar Productos</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          <VStack spacing={4} align="stretch">
            {orderedProducts.map((product, index) => (
              <Box
                key={product.id}
                p={4}
                bg="white"
                borderRadius="md"
                boxShadow="sm"
                border="1px"
                borderColor="gray.200"
              >
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={4} flex={1}>
                    <Image
                      src={product.image}
                      alt={product.title}
                      boxSize="50px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                    <Text fontWeight="medium">{product.title}</Text>
                  </Flex>
                  <Flex gap={2}>
                    <IconButton
                      aria-label="Mover arriba"
                      icon={<FaArrowUp />}
                      size="sm"
                      isDisabled={index === 0}
                      onClick={() => moveProduct(index, 'up')}
                    />
                    <IconButton
                      aria-label="Mover abajo"
                      icon={<FaArrowDown />}
                      size="sm"
                      isDisabled={index === orderedProducts.length - 1}
                      onClick={() => moveProduct(index, 'down')}
                    />
                  </Flex>
                </Flex>
              </Box>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSave}
            isLoading={isSaving}
          >
            Guardar orden
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProductOrderManager; 