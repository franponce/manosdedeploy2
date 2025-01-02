import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Image,
  Text,
  Button,
  VStack,
  Heading,
  Grid,
  GridItem,
  Skeleton,
  useToast,
  Icon,
  Flex,
  Stack,
  Tooltip,
  IconButton,
  HStack,
  SkeletonText,
  Spinner,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useProduct } from '../../hooks/useProduct';
import { useSiteInfo } from '../../hooks/useSiteInfo';
import { parseCurrency } from '../../utils/currency';
import { FaArrowLeft, FaShoppingCart, FaCopy } from 'react-icons/fa';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { useCart } from '../../hooks/useCart';
import CartDrawer from '@/product/components/CartDrawer';
import {
  WhatsappShareButton,
  WhatsappIcon,
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon,
  EmailShareButton,
  EmailIcon
} from 'next-share';
import { Product, CartItem } from '@/product/types';
import { NextPage } from 'next';
import ImageCarousel from '@/product/components/ImageCarousel';
import error from 'next/error';
import { useProductsStock } from '@/hooks/useProductsStock';
import { useStock } from '../../hooks/useStock';
import { stockService } from '../../utils/stockService';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactElement;
};

const calculateTotal = (cart: CartItem[]) => 
  parseCurrency((Array.isArray(cart) ? cart : []).reduce(
    (total: number, item: CartItem) => total + (item?.price || 0) * (item?.quantity || 0), 
    0
  ));

const calculateQuantity = (cart: CartItem[]) => 
  (Array.isArray(cart) ? cart : []).reduce(
    (acc: number, item: CartItem) => acc + (item?.quantity || 0), 
    0
  );

const processImages = (images: string[] = []) => {
  return images
    .filter(Boolean)
    .map(url => {
      try {
        return url.split('|||')[0].trim();
      } catch (e) {
        console.error('Error processing image URL:', url);
        return null;
      }
    })
    .filter(Boolean);
};

interface ProductDetailProps {
  product: Product;
  onAddToCart: (item: Product & { quantity: number }) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onAddToCart }) => {
  const { available: stock, isLoading: stockLoading } = useStock(product?.id || null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const toast = useToast();
  
  // Validar stock antes de agregar al carrito
  const handleAddToCart = async () => {
    if (!product?.id) return;

    try {
      const currentStock = await stockService.getAvailableStock(product.id);
      
      if (currentStock < selectedQuantity) {
        toast({
          title: "Error",
          description: "No hay suficiente stock disponible",
          status: "error",
          duration: 3000,
        });
        return;
      }

      onAddToCart({
        ...product,
        quantity: selectedQuantity
      });

      toast({
        title: "¡Producto agregado!",
        description: "El producto se agregó al carrito",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error al verificar stock:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar el stock disponible",
        status: "error",
        duration: 3000,
      });
    }
  };

  if (!product) {
    return <Box>Producto no encontrado</Box>;
  }

  return (
    <Box>
      {/* ... otros elementos ... */}
      
      {/* Mostrar stock */}
      <Text color={stock > 0 ? "green.500" : "red.500"}>
        {stockLoading ? (
          <Spinner size="sm" />
        ) : stock > 0 ? (
          `${stock} unidad${stock !== 1 ? 'es' : ''} disponible${stock !== 1 ? 's' : ''}`
        ) : (
          "Sin stock disponible"
        )}
      </Text>

      {/* Control de cantidad */}
      <NumberInput
        max={stock}
        min={1}
        value={selectedQuantity}
        onChange={(_, value) => setSelectedQuantity(value)}
        isDisabled={stock === 0}
      >
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      {/* Botón de agregar al carrito */}
      <Button
        colorScheme="blue"
        onClick={handleAddToCart}
        isDisabled={stock === 0}
        isLoading={stockLoading}
      >
        Agregar al carrito
      </Button>
    </Box>
  );
};

export default ProductDetail; 