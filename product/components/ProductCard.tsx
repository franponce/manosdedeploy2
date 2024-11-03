import React, { useEffect, useState } from 'react';
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
  useDisclosure,
} from '@chakra-ui/react';
import { Product } from '../types';
import { parseCurrency } from '../../utils/currency';
import { useSiteInfo } from '../../hooks/useSiteInfo';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useCart } from '../../hooks/useCart';

interface Props {
  product: Product;
  onAdd: (product: Product) => void;
  isLoading: boolean;
  stockStatusRenderer?: (product: Product) => React.ReactNode;
}

const ProductCard: React.FC<Props> = ({ product, onAdd, isLoading, stockStatusRenderer }) => {
  const { siteInfo } = useSiteInfo();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const router = useRouter();
  const { addToCart } = useCart();
  const [currentStock, setCurrentStock] = useState(product.stock);

  // Verificar stock en tiempo real
  useEffect(() => {
    const checkStock = async () => {
      try {
        const response = await fetch(`/api/products/${product.id}/stock`);
        const data = await response.json();
        setCurrentStock(data.stock);
      } catch (error) {
        console.error('Error verificando stock:', error);
      }
    };

    if (!isLoading && product.id) {
      checkStock();
      const interval = setInterval(checkStock, 30000); // Actualizar cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [product.id, isLoading]);

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
    function toggleDescription(event: React.MouseEvent<HTMLButtonElement>): void {
      event.stopPropagation();
      setIsDescriptionExpanded(!isDescriptionExpanded);
    }

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

  const renderStockStatus = () => {
    if (currentStock === 0) {
      return (
        <Text 
          fontSize="sm" 
          color="red.500"
          fontWeight="bold"
          textAlign="center"
        >
          Sin stock disponible
        </Text>
      );
    }

    return (
      <Text 
        fontSize="sm" 
        color="green.500"
        fontWeight="bold"
        textAlign="center"
      >
        Stock disponible: {currentStock} unidades
      </Text>
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
        {isLoading ? (
          <Skeleton />
        ) : (
          <Link as="div" onClick={handleProductClick} cursor="pointer">
            <Image 
              src={product.image || 'https://via.placeholder.com/500'} 
              alt={product.title || 'Product image'} 
              objectFit="cover" 
              fallbackSrc="https://via.placeholder.com/500"
            />
          </Link>
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
              {stockStatusRenderer ? stockStatusRenderer(product) : renderStockStatus()}
              <Button
                colorScheme={currentStock > 0 ? "blue" : "gray"}
                onClick={() => onAdd(product)}
                isDisabled={currentStock === 0}
                width="full"
              >
                {currentStock > 0 ? "Agregar al carrito" : "Sin stock disponible"}
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default ProductCard;
