import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Image,
  Text,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Product } from '../types';

interface ProductOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveOrder: (products: Product[]) => Promise<void>;
}

export function ProductOrderModal({ isOpen, onClose, products: initialProducts, onSaveOrder }: ProductOrderModalProps) {
  const [products, setProducts] = useState([...initialProducts]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= products.length) return;

    const newProducts = [...products];
    [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];
    setProducts(newProducts);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSaveOrder(products);
      toast({
        title: "Orden actualizado",
        status: "success",
        duration: 2000,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error al actualizar el orden",
        status: "error",
        duration: 2000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Ordenar Productos</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            {products.map((product, index) => (
              <HStack 
                key={product.id}
                w="100%"
                p={2}
                borderWidth={1}
                borderRadius="md"
                justify="space-between"
              >
                <HStack>
                  <Image
                    src={product.image}
                    alt={product.title}
                    boxSize="40px"
                    objectFit="cover"
                    borderRadius="md"
                  />
                  <Text>{product.title}</Text>
                </HStack>
                <HStack>
                  <IconButton
                    aria-label="Mover arriba"
                    icon={<ChevronUpIcon />}
                    size="sm"
                    isDisabled={index === 0}
                    onClick={() => moveProduct(index, 'up')}
                  />
                  <IconButton
                    aria-label="Mover abajo"
                    icon={<ChevronDownIcon />}
                    size="sm"
                    isDisabled={index === products.length - 1}
                    onClick={() => moveProduct(index, 'down')}
                  />
                </HStack>
              </HStack>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button mr={3} onClick={onClose}>
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
} 