import React from 'react';
import { Box, Image, Text, Button, Stack, AspectRatio } from '@chakra-ui/react';
import { Product } from '../types';
import { parseCurrency } from '../../utils/currency';
import { useSiteInfo } from '../../hooks/useSiteInfo';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
}

const ProductCard: React.FC<Props> = ({ product, onAdd }) => {
  const { siteInfo } = useSiteInfo();

  if (!product) {
    return null; // O puedes retornar un componente de fallback
  }

  return (
    <Box borderWidth={1} borderRadius="lg" overflow="hidden">
      <AspectRatio ratio={1}>
        <Image 
          src={product.image || 'https://via.placeholder.com/500'} 
          alt={product.title || 'Product image'} 
          objectFit="cover" 
          fallbackSrc="https://via.placeholder.com/500"
        />
      </AspectRatio>
      <Box p={4}>
        <Stack spacing={2}>
          <Text fontWeight="bold" fontSize="lg" noOfLines={2}>
            {product.title || 'Untitled Product'}
          </Text>
          <Text noOfLines={3}>{product.description || 'No description available'}</Text>
          <Text fontWeight="bold" fontSize="xl">
            {parseCurrency(product.price || 0)} {siteInfo?.currency}
          </Text>
          <Button 
            colorScheme="blue" 
            onClick={() => onAdd(product)}
            isDisabled={product.stock <= 0}
          >
            {product.stock > 0 ? "Agregar al carrito" : "Sin stock"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default ProductCard;
