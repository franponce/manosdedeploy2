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
  HStack,
} from '@chakra-ui/react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import useSWR, { mutate } from 'swr';
import { Product } from '../types';
import { SWR_KEYS } from '../constants';
import { getProducts, updateProductOrder } from '../../utils/googleSheets';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

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
  const { data: products, error, isLoading: isLoadingProducts } = useSWR<Product[]>(
    SWR_KEYS.PRODUCTS,
    () => getProducts(),
    {
      refreshInterval: 0, // Desactivamos el auto-refresh mientras ordenamos
      revalidateOnFocus: false,
    }
  );
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && products) {
      // Ordenar productos por el campo order
      const sortedProducts = [...products].sort((a, b) => {
        // Convertir order a número, si está vacío o no es número, usar Infinity
        const orderA = a.order ? parseInt(a.order) : Infinity;
        const orderB = b.order ? parseInt(b.order) : Infinity;
        return orderA - orderB;
      });
      
      setOrderedProducts(sortedProducts);
      setIsLoading(false);
    }
  }, [isOpen, products]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(orderedProducts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Actualizar el orden numérico
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: (index + 1).toString()
    }));

    setOrderedProducts(updatedItems);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProductOrder(orderedProducts);
      toast({
        title: "Orden actualizado",
        description: "El orden de los productos se ha actualizado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      mutate(SWR_KEYS.PRODUCTS);
      onClose();
    } catch (error) {
      console.error('Error updating product order:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden de los productos",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl" {...modalProps}>
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>Ordenar Productos</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {isLoading || isLoadingProducts ? (
            <Center py={10}>
              <VStack spacing={4}>
                <Spinner size="xl" />
                <Text>Cargando productos...</Text>
              </VStack>
            </Center>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="products">
                {(provided) => (
                  <VStack
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    spacing={2}
                    align="stretch"
                    w="100%"
                  >
                    {orderedProducts.map((product, index) => (
                      <Draggable
                        key={product.id}
                        draggableId={product.id}
                        index={index}
                      >
                        {(provided) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            p={4}
                            bg="white"
                            borderWidth="1px"
                            borderRadius="md"
                            shadow="sm"
                          >
                            <HStack spacing={4}>
                              <Text fontWeight="bold" minWidth="30px">
                                {index + 1}
                              </Text>
                              {product.images?.[0] && (
                                <Image
                                  src={product.images[0]}
                                  alt={product.title}
                                  boxSize="50px"
                                  objectFit="cover"
                                  borderRadius="md"
                                />
                              )}
                              <Text flex="1">{product.title}</Text>
                            </HStack>
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </VStack>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            isLoading={isLoading}
          >
            Guardar orden
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProductOrderManager; 