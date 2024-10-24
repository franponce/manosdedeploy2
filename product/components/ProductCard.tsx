import React, { useState } from 'react';
import {
  Button,
  Stack,
  Text,
  Image,
  Flex,
  Box,
  AspectRatio,
} from '@chakra-ui/react';
import { Product } from '../types';
import { parseCurrency } from '../../utils/currency';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
  isLoading: boolean;
}

const ProductCard: React.FC<Props> = ({ product, onAdd, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const truncateDescription = (description: string, maxLength: number) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  };

  const toggleDescription = () => {
    setIsExpanded(!isExpanded);
  };

  if (isLoading) {
    return (
      <Stack spacing={3} borderWidth={1} borderRadius="md" padding={4}>
        <AspectRatio ratio={1}>
          <Box bg="gray.100" />
        </AspectRatio>
        <Box bg="gray.100" height={6} width="70%" />
        <Box bg="gray.100" height={4} width="40%" />
        <Box bg="gray.100" height={10} width="100%" />
      </Stack>
    );
  }

  return (
    <Stack spacing={3} borderWidth={1} borderRadius="md" padding={4}>
      <AspectRatio ratio={1}>
        <Image src={product.image} alt={product.title} objectFit="cover" />
      </AspectRatio>
      <Text fontWeight="semibold">{product.title}</Text>
      <Box>
        <Text fontSize="sm" color="gray.600">
          {isExpanded ? product.description : truncateDescription(product.description, 150)}
        </Text>
        {product.description.length > 150 && (
          <Button
            size="sm"
            variant="link"
            color="blue.500"
            onClick={toggleDescription}
            mt={1}
          >
            {isExpanded ? "Ver menos" : "Ver más"}
          </Button>
        )}
      </Box>
      <Flex alignItems="center" justifyContent="space-between">
        <Text fontSize="sm" fontWeight="500">
          {parseCurrency(product.price)}
        </Text>
        <Button
          colorScheme="primary"
          variant="outline"
          size="sm"
          onClick={() => onAdd(product)}
        >
          Agregar
        </Button>
      </Flex>
    </Stack>
  );
};

export default ProductCard;
