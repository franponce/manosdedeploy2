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
  useMediaQuery,
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isMobile] = useMediaQuery("(max-width: 48em)");

  if (!product && !isLoading) {
    return null;
  }

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const renderTitle = () => {
    return (
      <Text
        fontWeight="bold"
        fontSize="lg"
        noOfLines={isMobile ? undefined : 2}
      >
        {product.title || 'Untitled Product'}
      </Text>
    );
  };

  const renderDescription = () => {
    return (
      <Box>
        <div
          dangerouslySetInnerHTML={{ __html: product.description || 'No description available' }}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: isDescriptionExpanded ? 'unset' : 3,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.5em',
            maxHeight: isDescriptionExpanded ? 'none' : '4.5em', // 3 líneas
          }}
        />
        {product.description && product.description.length > 150 && (
          <Button
            size="xs"
            variant="link"
            color="blue.500"
            onClick={toggleDescription}
            mt={1}
          >
            {isDescriptionExpanded ? "Ver menos" : "Ver más"}
          </Button>
        )}
      </Box>
    );
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
              {renderTitle()}
              {renderDescription()}
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
