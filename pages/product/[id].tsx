import React, { useState, useEffect, useMemo } from 'react';
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

type NextPageWithLayout = NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactElement;
};

const ProductDetail: NextPageWithLayout = () => {
  const router = useRouter();
  const { id } = router.query;
  const { product, isLoading, error } = useProduct(id ? id as string : null);
  const { siteInfo } = useSiteInfo();
  const toast = useToast();
  const { cart, addToCart, removeFromCart } = useCart();
  const [isCartOpen, toggleCart] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(window.location.href);
    }
  }, []);

  if (!id) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Skeleton height="400px" />
        </VStack>
      </Container>
    );
  }

  const total = useMemo(
    () => parseCurrency((Array.isArray(cart) ? cart : []).reduce(
      (total: number, item: CartItem) => total + (item?.price || 0) * (item?.quantity || 0), 
      0
    )),
    [cart]
  );

  const quantity = useMemo(
    () => (Array.isArray(cart) ? cart : []).reduce(
      (acc: number, item: CartItem) => acc + (item?.quantity || 0), 
      0
    ),
    [cart]
  );

  const handleEditCart = (product: Product | CartItem, action: "increment" | "decrement") => {
    const cartItem: CartItem = 'quantity' in product 
      ? product as CartItem
      : { ...product, quantity: 1 };

    if (action === "increment") {
      addToCart(cartItem);
    } else {
      removeFromCart(cartItem);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
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

  if (error) {
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

  return (
    <>
      <Box 
        as="header" 
        position="fixed"
        top="0"
        left="0"
        right="0"
        bg="white"
        boxShadow="sm"
        zIndex="sticky"
      >
        <Container maxW="container.xl" py={4}>
          <Button
            leftIcon={<Icon as={FaArrowLeft} />}
            onClick={handleBackToStore}
            colorScheme="blue"
            variant="ghost"
            size="md"
          >
            Volver a la tienda
          </Button>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8} mt="60px">
        <VStack spacing={8} align="stretch">
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8}>
            <GridItem>
              <Skeleton isLoaded={!isLoading} height="400px">
                {product && product.images ? (
                  <ImageCarousel 
                    images={product.images}
                    autoPlayInterval={4000}
                    showControls={true}
                  />
                ) : (
                  <Box height="400px" bg="gray.100" />
                )}
              </Skeleton>
            </GridItem>

            <GridItem>
              <VStack spacing={6} align="stretch">
                <Skeleton isLoaded={!isLoading}>
                  <Heading as="h1" size="xl">
                    {product?.title}
                  </Heading>
                </Skeleton>

                <Skeleton isLoaded={!isLoading}>
                  <Text fontSize="2xl" fontWeight="bold">
                    {parseCurrency(product?.price || 0)}
                  </Text>
                </Skeleton>

                <Skeleton isLoaded={!isLoading}>
                  <Button
                    size="lg"
                    colorScheme="blue"
                    leftIcon={<Icon as={FaShoppingCart} />}
                    onClick={handleAddToCart}
                    width="full"
                  >
                    Agregar al carrito
                  </Button>
                </Skeleton>

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
        </VStack>
      </Container>

      {Boolean(cart.length) && (
        <Flex alignItems="center" bottom={4} justifyContent="center" position="sticky">
          <Button
            boxShadow="xl"
            colorScheme="primary"
            data-testid="show-cart"
            size="lg"
            width={{ base: "100%", sm: "fit-content" }}
            onClick={() => toggleCart(true)}
          >
            <Stack alignItems="center" direction="row" spacing={6}>
              <Stack alignItems="center" direction="row" spacing={3}>
                <Text fontSize="md" lineHeight={6}>
                  Ver carrito
                </Text>
                <Text
                  backgroundColor="rgba(0,0,0,0.25)"
                  borderRadius="sm"
                  color="gray.100"
                  fontSize="xs"
                  fontWeight="500"
                  paddingX={2}
                  paddingY={1}
                >
                  {quantity} {quantity === 1 ? "item" : "items"}
                </Text>
              </Stack>
              <Text fontSize="md" lineHeight={6}>
                {total}
              </Text>
            </Stack>
          </Button>
        </Flex>
      )}

      <CartDrawer
        isOpen={isCartOpen}
        items={cart}
        onClose={() => toggleCart(false)}
        onDecrement={(product) => handleEditCart(product, "decrement")}
        onIncrement={(product) => handleEditCart(product, "increment")}
      />
    </>
  );
};

ProductDetail.getLayout = (page: React.ReactElement) => page;

export default ProductDetail; 