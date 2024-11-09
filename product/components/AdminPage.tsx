import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Icon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Text,
  IconButton,
  Image
} from '@chakra-ui/react';
import { FaSort } from 'react-icons/fa';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { Product } from '../types';

export function AdminPage() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast({
        title: "Error al cargar productos",
        status: "error",
        duration: 2000
      });
    }
  }, [toast]);

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === products.length - 1)
    ) return;

    const newProducts = [...products];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];
    setProducts(newProducts);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });

      toast({
        title: "Orden actualizado",
        status: "success",
        duration: 2000
      });
      setIsOrderModalOpen(false);
    } catch (error) {
      toast({
        title: "Error al guardar el orden",
        status: "error",
        duration: 2000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Button
        leftIcon={<Icon as={FaSort} />}
        onClick={() => {
          loadProducts();
          setIsOrderModalOpen(true);
        }}
        colorScheme="purple"
        mb={4}
      >
        Ordenar productos
      </Button>

      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ordenar Productos</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              {products.map((product, index) => (
                <HStack 
                  key={product.id}
                  w="100%"
                  p={4}
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
            <Button mr={3} onClick={() => setIsOrderModalOpen(false)}>
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
    </Box>
  );
}