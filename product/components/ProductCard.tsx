import React, { useState } from 'react';
import {
  Box,
  Image,
  Text,
  Button,
  Stack,
  AspectRatio,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react';
import { Product } from '../types';
import { parseCurrency } from '../../utils/currency';
import { useSiteInfo } from '../../hooks/useSiteInfo';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
  isLoading: boolean;
}

const ProductCard: React.FC<Props> = ({ product, onAdd, isLoading }) => {
  const { siteInfo } = useSiteInfo();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!product && !isLoading) {
    return null;
  }

  const truncateDescription = (description: string, maxLength: number) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  };

  const toggleDescription = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Box borderWidth={1} borderRadius="lg" overflow="hidden">
      <AspectRatio ratio={1}>
        {isLoading ? (
          <Skeleton />
        ) : (
          <Image 
            src={product.image || 'https://via.placeholder.com/500'} 
            alt={product.title || 'Product image'} 
            objectFit="cover" 
            fallbackSrc="https://via.placeholder.com/500"
          />
        )}
      </AspectRatio>
      <Box p={4}>
        <Stack spacing={2}>
          {isLoading ? (
            <>
              <SkeletonText noOfLines={2} spacing="4" />
              <SkeletonText noOfLines={3} spacing="4" />
              <Skeleton height="24px" />
              <Skeleton height="40px" />
            </>
          ) : (
            <>
              <Text fontWeight="bold" fontSize="lg" noOfLines={2}>
                {product.title || 'Untitled Product'}
              </Text>
              <Box>
                <Text noOfLines={isExpanded ? undefined : 3}>
                  {isExpanded 
                    ? product.description || 'No description available'
                    : truncateDescription(product.description || 'No description available', 150)
                  }
                </Text>
                {(product.description?.length || 0) > 150 && (
                  <Button
                    size="xs"
                    variant="link"
                    color="blue.500"
                    onClick={toggleDescription}
                    mt={1}
                  >
                    {isExpanded ? "Ver menos" : "Ver más"}
                  </Button>
                )}
              </Box>
              <Text fontWeight="bold" fontSize="xl">
                {parseCurrency(product.price || 0)} {siteInfo?.currency}
              </Text>
              <Button colorScheme="blue" onClick={() => onAdd(product)}>
                Agregar al carrito
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default ProductCard;
