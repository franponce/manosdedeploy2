import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Image,
  Text,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { useProducts } from '@/hooks/useProducts';
import { useProductOrder } from '@/hooks/useProductOrder';
import { Product } from '../types';

export function ProductOrderManager() {
  const { products } = useProducts();
  const { productOrders, updateProductOrder } = useProductOrder();
  const toast = useToast();

  const moveProduct = async (productId: string, direction: 'up' | 'down') => {
    if (!productOrders) return;

    const currentIndex = productOrders.findIndex(p => p.id === productId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= productOrders.length) return;

    const newOrders = [...productOrders];
    const temp = newOrders[currentIndex].position;
    newOrders[currentIndex].position = newOrders[newIndex].position;
    newOrders[newIndex].position = temp;

    try {
      await updateProductOrder(newOrders);
      toast({
        title: "Orden actualizado",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Error al actualizar el orden",
        status: "error",
        duration: 2000,
      });
    }
  };

  return (
    <VStack spacing={4} align="stretch" w="100%" maxW="800px" mx="auto" p={4}>
      {products?.map((product, index) => (
        <HStack 
          key={product.id}
          p={4}
          bg="white"
          borderRadius="md"
          boxShadow="sm"
          justify="space-between"
        >
          <HStack spacing={4}>
            <Image
              src={product.image}
              alt={product.title}
              boxSize="50px"
              objectFit="cover"
              borderRadius="md"
            />
            <Box>
              <Text fontWeight="medium">{product.title}</Text>
              <Text fontSize="sm" color="gray.500">
                Posición actual: {index + 1}
              </Text>
            </Box>
          </HStack>
          
          <HStack>
            <IconButton
              aria-label="Mover arriba"
              icon={<ChevronUpIcon />}
              size="sm"
              isDisabled={index === 0}
              onClick={() => moveProduct(product.id, 'up')}
            />
            <IconButton
              aria-label="Mover abajo"
              icon={<ChevronDownIcon />}
              size="sm"
              isDisabled={index === products.length - 1}
              onClick={() => moveProduct(product.id, 'down')}
            />
          </HStack>
        </HStack>
      ))}
    </VStack>
  );
} 