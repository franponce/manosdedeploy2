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
  Spinner,
  Center,
} from '@chakra-ui/react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import useSWR, { mutate } from 'swr';
import { Product } from '../types';
import { SWR_KEYS } from '../constants';
import { getProducts, updateProductOrder } from '../../utils/googleSheets';

interface ProductOrderManagerProps {
  isOpen: boolean;
  onClose: () => void;
  modalProps?: {
    zIndex?: number;
    [key: string]: any;
  };
}

const ProductOrderManager: React.FC<ProductOrderManagerProps> = ({ 
  isOpen, 
  onClose,
  modalProps = {} 
}) => {
  const toast = useToast();
  const { data: products, error, isLoading } = useSWR<Product[]>(
    SWR_KEYS.PRODUCTS,
    () => getProducts(),
    {
      refreshInterval: 0, // Desactivamos el auto-refresh mientras ordenamos
      revalidateOnFocus: false,
    }
  );
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (products) {
      // Aseguramos que los productos estén ordenados por ID
      const sortedProducts = [...products].sort((a, b) => 
        parseInt(a.id) - parseInt(b.id)
      );
      setOrderedProducts(sortedProducts);
    }
  }, [products]);

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newProducts = [...orderedProducts];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < newProducts.length) {
      [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];
      setOrderedProducts(newProducts);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Actualizamos el orden en el sheet
      await updateProductOrder(orderedProducts.map(p => p.id));
      
      // Actualizamos el cache de SWR con el nuevo orden
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
      console.error('Error al guardar el orden:', error);
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

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Error</ModalHeader>
          <ModalBody>
            No se pudieron cargar los productos. Por favor, intente nuevamente.
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Cerrar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...modalProps}>
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>Ordenar Productos</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          {isLoading ? (
            <Center py={8}>
              <Spinner size="xl" />
            </Center>
          ) : (
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
                      <Text color="gray.500" fontWeight="medium" minW="30px">
                        #{index + 1}
                      </Text>
                      <Image
                        src={product.images[0]}
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
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSave}
            isLoading={isSaving}
            isDisabled={isLoading}
          >
            Guardar orden
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProductOrderManager; 