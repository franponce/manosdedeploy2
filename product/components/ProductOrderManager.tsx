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
import { productService } from '../../utils/firebase';

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
    async () => {
      const data = await productService.getProducts();
      return data as Product[]; // Aseguramos el tipo correcto
    },
    {
      refreshInterval: 0, // Desactivamos el auto-refresh mientras ordenamos
      revalidateOnFocus: false,
    }
  );
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && products) {
      // Ordenamos los productos según el orden guardado en el sheet
      const sortedProducts = [...products].sort((a, b) => {
        // Convertimos el orden a número, si no existe usamos Infinity para ponerlo al final
        const orderA = a.order ? parseInt(a.order, 10) : Infinity;
        const orderB = b.order ? parseInt(b.order, 10) : Infinity;
        return orderA - orderB;
      });

      setOrderedProducts(sortedProducts);
    }
  }, [isOpen, products]);

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
      await productService.updateProductOrder(orderedProducts.map(p => p.id));
      
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

  const normalizeImage = (images: string | string[] | undefined): string => {
    if (!images) return '';
    
    if (typeof images === 'string') {
      const parts = images.split('|||');
      return parts[0] || '';
    }
    
    if (Array.isArray(images)) {
      return images[0] || '';
    }
    
    return '';
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
        <ModalHeader>
          {isSaving ? 'Guardando orden...' : 'Ordenar productos'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          {isLoading || isSaving ? (
            <Center py={8}>
              <VStack spacing={4}>
                <Spinner size="xl" />
                <Text>
                  {isLoading ? 'Cargando productos...' : 'Guardando cambios...'}
                </Text>
              </VStack>
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
                      <Flex direction="column" align="center" minW="50px">
                        <Text color="gray.500" fontSize="sm">
                          Orden
                        </Text>
                        <Text color="blue.500" fontWeight="bold">
                          #{index + 1}
                        </Text>
                      </Flex>
                      <Image
                        src={normalizeImage(product.images)}
                        alt={product.title}
                        boxSize="50px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                      <Box maxW="200px">
                        <Text 
                          fontWeight="medium"
                          noOfLines={1}
                          title={product.title}
                        >
                          {product.title}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          ID: {product.id}
                        </Text>
                      </Box>
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
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            isDisabled={isSaving}
          >
            Cancelar
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSave}
            isLoading={isSaving}
            loadingText="Guardando..."
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