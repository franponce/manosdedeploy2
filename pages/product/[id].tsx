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

const ProductDetail: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const { product, isLoading, error } = useProduct(id ? id as string : null);
  const { siteInfo } = useSiteInfo();
  const toast = useToast({
    position: 'top',
  });
  const { cart, addToCart, removeFromCart } = useCart();
  const [copied, setCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState<string>('');

  const { stocks, isLoading: stocksLoading } = useProductsStock(
    product ? [product] : []
  );

  const available = product ? stocks[product.id] || 0 : 0;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href);
    }
  }, []);
  const handleBack = useCallback(() => {
    sessionStorage.setItem('lastViewedProductId', id as string);
    router.push('/');
  }, [router, id]);

  useEffect(() => {
    router.prefetch('/');
  }, [router]);

  if (isLoading || stocksLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="400px" />
          <Box>
            <SkeletonText noOfLines={4} spacing={4} />
          </Box>
        </VStack>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Box
            textAlign="center"
            py={10}
            borderRadius="lg"
            bg="gray.50"
            p={8}
          >
            <Heading size="lg" mb={4} color="gray.600">
              Producto no encontrado
            </Heading>
            <Text mb={6} color="gray.500">
              Lo sentimos, el producto que buscas no está disponible en este momento.
            </Text>
            <Button colorScheme="blue" onClick={() => router.push('/')}>
              Ver otros productos
            </Button>
          </Box>
        </VStack>
      </Container>
    );
  }

  const total = calculateTotal(cart);
  const quantity = calculateQuantity(cart);

  const handleAddToCart = () => {
    if (!product || !available) return;
    
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
    
    const cartItem: CartItem = {
      ...product,
      quantity: 1
    };
    
    addToCart(cartItem);
    toast({
      title: "Producto agregado",
      description: "El producto se agregó al carrito",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const shareText = `¡Mira este producto! ${product?.title} 🛒`;
  const shareTextWithPrice = `¡Descubrí ${product?.title} por ${parseCurrency(product?.price || 0)}! 🛒`;
  const emailSubject = `Te comparto este producto de ${siteInfo?.storeName || 'nuestra tienda'}`;
  const emailBody = `Hola! Encontré este producto que te puede interesar:\n\n${product?.title}\n${pageUrl}`;

  const handleCopyLink = () => {
    const textToCopy = `¡Mirá este producto! ${product?.title}\n${pageUrl}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderDescription = () => {
    if (!product?.description) return null;

    const cleanDescription = (html: string) => {
      return html
        .replace(/<p><br><\/p>/g, '')
        .replace(/<p>\s*<\/p>/g, '')
        .replace(/<\/li>\s*<li>/g, '</li><li>')
        .trim();
    };

    return (
      <Box
        width="full"
        sx={{
          '& p': {
            fontSize: { base: "sm", md: "md" },
            color: 'gray.700',
            lineHeight: 'tall',
            marginBottom: 2,
            width: "100%",
            textAlign: "left",
            '&:empty': { display: 'none' }
          },
          '& ul': {
            width: "100%",
            paddingLeft: "1rem",
            marginBottom: 3,
            listStyle: "disc"
          },
          '& li': {
            marginBottom: 1,
            textAlign: "left"
          },
          '& strong': { fontWeight: '600' },
          '& em': { fontStyle: 'italic' },
          '& br': { 
            display: 'none'
          },
          overflowWrap: 'break-word',
          wordWrap: 'break-word',
          wordBreak: 'break-word'
        }}
        dangerouslySetInnerHTML={{ 
          __html: cleanDescription(product.description) 
        }}
      />
    );
  };

  const handleBackToStore = () => {
    sessionStorage.setItem('lastViewedProductId', id as string);
    router.push('/');
  };

  console.log('Product images from API:', product?.images);

  return (
    <>
      <Box bg="white" position="sticky" top={0} zIndex={10} borderBottom="1px" borderColor="gray.200">
        <Container maxW="container.xl" py={4}>
          <Button
            leftIcon={<Icon as={FaArrowLeft} />}
            variant="ghost"
            onClick={handleBack}
            size="md"
            bg="gray.50"
          >
            Volver a la tienda
          </Button>
        </Container>
      </Box>

      <Container maxW="container.xl" pt={20}>
        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8}>
          <GridItem>
            <ImageCarousel images={product?.images || []} />
          </GridItem>

          <GridItem>
            <VStack spacing={6} align="stretch">
              <Skeleton isLoaded={!isLoading}>
                <Heading as="h1" size="xl">
                  {product?.title}
                </Heading>
              </Skeleton>

              <Text fontSize="sm" color={available === 0 ? "red.500" : "gray.600"}>
                {available === 0 ? "Agotado" : `Stock disponible: ${available}`}
              </Text>

              <Skeleton isLoaded={!isLoading}>
                <Text fontSize="2xl" fontWeight="bold">
                  {parseCurrency(product?.price || 0)}
                </Text>
              </Skeleton>

              <Skeleton isLoaded={!isLoading}>
                <Button
                  colorScheme="blue"
                  size="lg"
                  width="100%"
                  onClick={handleAddToCart}
                  isDisabled={available === 0}
                  mb={4}
                >
                  {available === 0 ? "Agotado" : "Agregar al carrito"}
                </Button>
              </Skeleton>
              {available > 0 && available <= 5 && (
                <Text color="orange.500" fontSize="sm" textAlign="center" mb={4}>
                  {available === 1 
                    ? "¡Última unidad en stock!" 
                    : `¡Últimas ${available} unidades en stock!`}
                </Text>
              )}

              <Skeleton isLoaded={!isLoading}>
                <Box>
                  <Text mb={2} fontWeight="medium">Compartir producto:</Text>
                  <HStack spacing={2}>
                    <Tooltip label="Compartir en WhatsApp">
                      <WhatsappShareButton
                        url={pageUrl}
                        title={shareTextWithPrice}
                      >
                        <WhatsappIcon size={40} round />
                      </WhatsappShareButton>
                    </Tooltip>

                    <Tooltip label="Compartir en Facebook">
                      <FacebookShareButton
                        url={pageUrl}
                        quote={shareText}
                      >
                        <FacebookIcon size={40} round />
                      </FacebookShareButton>
                    </Tooltip>

                    <Tooltip label="Compartir en Twitter">
                      <TwitterShareButton
                        url={pageUrl}
                        title={shareText}
                      >
                        <TwitterIcon size={40} round />
                      </TwitterShareButton>
                    </Tooltip>

                    <Tooltip label="Compartir por email">
                      <EmailShareButton
                        url={pageUrl}
                        subject={emailSubject}
                        body={emailBody}
                      >
                        <EmailIcon size={40} round />
                      </EmailShareButton>
                    </Tooltip>

                    <Tooltip label={copied ? "¡Copiado!" : "Copiar enlace"}>
                      <IconButton
                        aria-label="Copiar enlace"
                        icon={<FaCopy />}
                        onClick={handleCopyLink}
                        size="lg"
                        colorScheme={copied ? "green" : "gray"}
                        rounded="full"
                      />
                    </Tooltip>
                  </HStack>
                </Box>
              </Skeleton>

              <Box>
                <Skeleton isLoaded={!isLoading}>
                  <Text fontWeight="medium" mb={2}>Descripción:</Text>
                </Skeleton>
                <SkeletonText isLoaded={!isLoading} noOfLines={4} spacing={4}>
                  {renderDescription()}
                </SkeletonText>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </Container>

      <CartDrawer
        isOpen={false}
        items={cart}
        onClose={() => {}}
        onDecrement={(product) => {}}
        onIncrement={(product) => {}}
      />
    </>
  );
};

ProductDetail.getLayout = (page: React.ReactElement) => page;

export default ProductDetail; 