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
  Link,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { Product } from '../types';
import { parseCurrency } from '../../utils/currency';
import { useRouter } from 'next/router';
import { VisibilityToggle } from './VisibilityToggle';
import ImageCarousel from './ImageCarousel';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
  isLoading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onVisibilityToggle: (id: string, isVisible: boolean) => void;
  isAdminView?: boolean;
}

const ProductCard: React.FC<Props> = ({ product, onAdd, isLoading: cardLoading, onEdit, onDelete, onVisibilityToggle, isAdminView = false }) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const router = useRouter();

  const handleProductClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/product/${product.id}`);
  };

  const renderTitle = () => {
    const titleContent = (
      <Text
        fontWeight="bold"
        fontSize="lg"
        noOfLines={isTitleExpanded ? undefined : 2}
        cursor="pointer"
        _hover={{ color: "blue.500" }}
        onClick={handleProductClick}
      >
        {product.title || 'Untitled Product'}
      </Text>
    );

    if (isMobile) {
      return (
        <Box>
          {titleContent}
          {product.title && product.title.length > 50 && (
            <Button
              size="xs"
              variant="link"
              color="blue.500"
              onClick={(e) => {
                e.stopPropagation();
                setIsTitleExpanded(!isTitleExpanded);
              }}
              mt={1}
            >
              {isTitleExpanded ? "Ver menos" : "Ver título completo"}
            </Button>
          )}
        </Box>
      );
    }

    return (
      <Box
        onMouseEnter={() => setIsTitleExpanded(true)}
        onMouseLeave={() => setIsTitleExpanded(false)}
      >
        {titleContent}
      </Box>
    );
  };

  const renderDescription = () => {
    const truncateText = (html: string, maxLength: number) => {
      if (html.length <= maxLength) return html;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const text = tempDiv.textContent || tempDiv.innerText;
      return text.slice(0, maxLength) + '...';
    };

    return (
      <Box>
        <Box
          sx={{
            '& p': { marginBottom: '0.5em' },
            '& ul, & ol': { paddingLeft: '1.5em', marginBottom: '0.5em' },
            '& li': { marginBottom: '0.25em' }
          }}
        >
          <div
            dangerouslySetInnerHTML={{ 
              __html: isDescriptionExpanded 
                ? product.description 
                : truncateText(product.description || '', 150)
            }}
          />
        </Box>
        {product.description && product.description.length > 150 && (
          <Button
            size="xs"
            variant="link"
            color="blue.500"
            onClick={(e) => {
              e.stopPropagation();
              setIsDescriptionExpanded(!isDescriptionExpanded);
            }}
            mt={1}
          >
            {isDescriptionExpanded ? "Ver menos" : "Ver más"}
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Box 
      borderWidth={1} 
      borderRadius="lg" 
      overflow="hidden"
      transition="transform 0.2s"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
    >
      <AspectRatio ratio={1}>
        {cardLoading ? (
          <Skeleton />
        ) : (
          <Link as="div" onClick={handleProductClick} cursor="pointer">
            <Box position="relative">
              <ImageCarousel 
                images={product.images}
                autoPlayInterval={4000}
                showControls={false}
              />
            </Box>
          </Link>
        )}
      </AspectRatio>
      <Box p={4}>
        <Stack spacing={2}>
          {cardLoading ? (
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
                {parseCurrency(product.price || 0)}
              </Text>
              <Button
                colorScheme="blue"
                onClick={handleProductClick}
                width="full"
              >
                Ver detalle
              </Button>
            </>
          )}
        </Stack>
      </Box>
      {isAdminView && (
        <VisibilityToggle
          isVisible={product.isVisible ?? true}
          productId={product.id}
        />
      )}
    </Box>
  );
};

export default ProductCard;
