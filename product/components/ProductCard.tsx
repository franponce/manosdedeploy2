import React from 'react';
import { Box, Image, Text, Button, VStack } from '@chakra-ui/react';
import { Product } from '../types';

interface Props {
  product: Product;
  onAdd?: (product: Product) => void;
  isAdmin?: boolean;
}

const ProductCard: React.FC<Props> = ({ product, onAdd, isAdmin = false }) => {
  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={4}>
      <Image src={product.image} alt={product.title} />
      <VStack mt={2} align="start" spacing={2}>
        <Text fontWeight="bold">{product.title}</Text>
        <Text>${product.price.toFixed(2)}</Text>
        {!isAdmin && onAdd && (
          <Button onClick={() => onAdd(product)} colorScheme="blue">
            Agregar al carrito
          </Button>
        )}
        {isAdmin && (
          <Button colorScheme="green">
            Editar
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default ProductCard;
