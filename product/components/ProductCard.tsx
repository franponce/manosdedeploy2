import React, { useState, useEffect } from 'react';
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
  useToast,
} from '@chakra-ui/react';
import { Product } from '../types';
import { parseCurrency } from '../../utils/currency';
import { useRouter } from 'next/router';
import { VisibilityToggle } from './VisibilityToggle';
import ImageCarousel from './ImageCarousel';
import { stockService } from '../../utils/firebase';
import { useStock } from '@/hooks/useStock';
import { useCart } from '@/hooks/useCart';
import { FaEdit, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Icon } from '@chakra-ui/react';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  isLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onVisibilityToggle: () => void;
  isAdminView: boolean;
  actionButton?: React.ReactNode;
  available?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAdd,
  isLoading,
  onEdit,
  onDelete,
  onVisibilityToggle,
  isAdminView = false,
  actionButton,
  available = 0
}) => {
  const { available: stockAvailable, isLoading: stockLoading } = useStock(product.id);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isTitleExpanded, setIsTitleExpanded] = useState(false);
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const router = useRouter();
  const toast = useToast({
    position: 'top',
  });
  const { cart, addToCart } = useCart();

  const handleViewDetail = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/product/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!product || !available) {
      toast({
        title: "No hay stock disponible",
        description: "Este producto está agotado",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    const currentQuantity = existingItem?.quantity || 0;
    
    if (currentQuantity >= available) {
      toast({
        title: "No hay suficiente stock",
        description: "Has alcanzado el límite de unidades disponibles",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    addToCart({ ...product, quantity: 1 });
    if (onAdd) {
      onAdd(product);
    }
  };

  const renderTitle = () => {
    const titleContent = (
      <Text
        fontWeight="bold"
        fontSize="lg"
        noOfLines={isTitleExpanded ? undefined : 2}
        cursor="pointer"
        _hover={{ color: "blue.500" }}
        onClick={handleViewDetail}
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

  const AdminActions = () => (
    <Stack spacing={2}>
      <Button colorScheme="blue" onClick={onEdit}>
        Editar
      </Button>
      <Button colorScheme="red" onClick={onDelete}>
        Eliminar
      </Button>
    </Stack>
  );

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      position="relative"
      bg="white"
      opacity={available === 0 ? 0.7 : 1}
    >
      <AspectRatio ratio={1}>
        {isLoading ? (
          <Skeleton />
        ) : (
          <Box position="relative" onClick={(e) => e.preventDefault()}>
            <Box position="relative" height="100%" width="100%">
              <ImageCarousel 
                images={product.images}
              />
            </Box>
          </Box>
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
                {parseCurrency(product.price || 0)}
              </Text>
              <Text 
                fontSize="sm" 
                color={stockAvailable === 0 ? "red.500" : "green.500"}
                fontWeight={stockAvailable > 0 ? "semibold" : "normal"}
              >
                {stockAvailable === 0 ? "Agotado" : `Stock disponible: ${stockAvailable}`}
              </Text>
              <Stack spacing={1}>
                {isAdminView ? (
                  <AdminActions />
                ) : (
                  actionButton || (
                    <Button
                      colorScheme="blue"
                      width="100%"
                      onClick={() => onAdd(product)}
                      isDisabled={available === 0}
                    >
                      {available === 0 ? "Agotado" : "Agregar al carrito"}
                    </Button>
                  )
                )}
              </Stack>
              {stockAvailable > 0 && stockAvailable <= 5 && (
                <Text color="orange.500" fontSize="sm" mt={2}>
                  {stockAvailable === 1 
                    ? "¡Última unidad en stock!" 
                    : `¡Últimas ${stockAvailable} unidades en stock!`}
                </Text>
              )}
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
