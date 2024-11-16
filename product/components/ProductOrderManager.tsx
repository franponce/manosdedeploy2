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
} from '@chakra-ui/react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(orderedProducts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedProducts(items);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Actualizar el orden en Google Sheets
      await updateProductOrder(orderedProducts.map(p => p.id));
      
      // Actualizar el cache de SWR
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
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="products">
              {(provided) => (
                <VStack
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  spacing={4}
                  align="stretch"
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
                          borderRadius="md"
                          boxShadow="sm"
                          border="1px"
                          borderColor="gray.200"
                        >
                          <Flex align="center" gap={4}>
                            <Image
                              src={product.image}
                              alt={product.title}
                              boxSize="50px"
                              objectFit="cover"
                              borderRadius="md"
                            />
                            <Text fontWeight="medium">{product.title}</Text>
                          </Flex>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </VStack>
              )}
            </Droppable>
          </DragDropContext>
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