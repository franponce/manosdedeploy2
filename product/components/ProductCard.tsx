import React from 'react';
import { Box, Image, Text, Button } from '@chakra-ui/react';
import { Product } from '../types';

interface Props {
  product: Product;
  onAddToCart: () => void;
  isOutOfStock: boolean;
}

const ProductCard: React.FC<Props> = ({ product, onAddToCart }) => {
  const isOutOfStock = product.stock <= 0;

  return (
    <Box borderWidth={1} borderRadius="lg" overflow="hidden">
      <Image src={product.image} alt={product.title} />
      <Box p={4}>
        <Text fontWeight="bold">{product.title}</Text>
        <Text>{product.description}</Text>
        <Text fontWeight="bold">Precio: ${product.price}</Text>
        <Text>Stock: {product.stock}</Text>
        <Button
          onClick={onAddToCart}
          isDisabled={isOutOfStock}
          mt={2}
          colorScheme="blue"
        >
          {isOutOfStock ? "Sin stock" : "Agregar al carrito"}
        </Button>
      </Box>
    </Box>
  );
};

export default ProductCard;
