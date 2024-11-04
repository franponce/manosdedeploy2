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
import { CartItem, Product } from '@/product/types';
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
import useSWR from 'swr';

const ProductDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { product, isLoading, error } = useProduct(id as string);
  const { siteInfo } = useSiteInfo();
  const toast = useToast();
  const { saveScrollPosition } = useScrollPosition(id as string);
  const { cart, addToCart, removeFromCart } = useCart();
  const [isCartOpen, toggleCart] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: currentProduct } = useSWR(
    id ? `/api/products/${id}` : null,
    null,
    {
      refreshInterval: 10000,
      fallbackData: product
    }
  );

  const displayProduct = currentProduct || product;

  const total = useMemo(
    () => parseCurrency(cart.reduce((total, item) => total + item.price * item.quantity, 0)),
    [cart]
  );

  const quantity = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const handleBack = () => {
    saveScrollPosition();
    router.back();
  };

  const handleAddToCart = () => {
    if (!displayProduct?.stock || displayProduct.stock === 0) {
      toast({
        title: "Sin stock",
        description: "Este producto no tiene stock disponible",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const cartItem = cart.find(item => item.id === displayProduct.id);
    if (cartItem && cartItem.quantity >= displayProduct.stock) {
      toast({
        title: "Stock máximo alcanzado",
        description: `Solo hay ${displayProduct.stock} unidades disponibles`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    addToCart(displayProduct);
    toast({
      title: "Producto agregado",
      description: "El producto se agregó al carrito",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  function handleEditCart(product: Product, action: "increment" | "decrement") {
    if (action === "increment") {
      addToCart(product);
    } else {
      removeFromCart(product);
    }
  }

  const shareText = `¡Mira este producto! ${displayProduct?.title} 🛒`;
  const shareTextWithPrice = `¡Descubrí ${displayProduct?.title} por ${parseCurrency(displayProduct?.price || 0)}! 🛒`;
  const emailSubject = `Te comparto este producto de ${siteInfo?.storeName || 'nuestra tienda'}`;
  const emailBody = `Hola! Encontré este producto que te puede interesar:\n\n${displayProduct?.title}\n${window.location.href}`;

  const handleCopyLink = () => {
    const textToCopy = `¡Mirá este producto! ${displayProduct?.title}\n${window.location.href}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStockStatus = () => {
    if (!displayProduct?.stock || displayProduct.stock === 0) {
      return (
        <Text 
          color="red.500"
          fontWeight="medium"
          fontSize="md"
        >
          Sin stock disponible
        </Text>
      );
    }

    return (
      <HStack spacing={2}>
        <Text
          color="green.500"
          fontWeight="medium"
          fontSize="md"
        >
          Stock disponible: {displayProduct.stock} unidades
        </Text>
      </HStack>
    );
  };

  const renderDescription = () => {
    if (!displayProduct?.description) return null;

    return (
      <Box 
        maxH="300px" 
        overflowY="auto"
        borderRadius="md"
        p={4}
        bg="gray.50"
        sx={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'gray.300',
            borderRadius: '24px',
          },
          '& p': { 
            marginBottom: '0.5em',
            lineHeight: 'tall',
          },
          '& ul, & ol': { 
            paddingLeft: '1.5em',
            marginBottom: '0.5em',
          },
          '& li': { 
            marginBottom: '0.25em',
          },
          '& strong': {
            fontWeight: 'bold',
          },
          '& em': {
            fontStyle: 'italic',
          },
          '& p:empty': {
            display: 'none',
          },
          '& p:blank': {
            display: 'none',
          },
          '& > *:last-child': {
            marginBottom: 0,
          },
        }}
      >
        <Box
          dangerouslySetInnerHTML={{ 
            __html: displayProduct.description 
          }}
          fontSize="sm"
          color="gray.700"
        />
      </Box>
    );
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
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8}>
            <GridItem>
              <Skeleton isLoaded={!isLoading} height="400px">
                <Image
                  src={displayProduct?.image}
                  alt={displayProduct?.title}
                  objectFit="contain"
                  width="100%"
                  height="100%"
                />
              </Skeleton>
            </GridItem>

            <GridItem>
              <VStack spacing={6} align="stretch">
                <Skeleton isLoaded={!isLoading}>
                  <Heading as="h1" size="xl">
                    {displayProduct?.title}
                  </Heading>
                </Skeleton>

                <Box>
                  <Skeleton isLoaded={!isLoading}>
                    <Text fontSize="2xl" fontWeight="bold">
                      {parseCurrency(displayProduct?.price || 0)}
                    </Text>
                  </Skeleton>
                  <Skeleton isLoaded={!isLoading}>
                    {renderStockStatus()}
                  </Skeleton>
                </Box>

                <Skeleton isLoaded={!isLoading}>
                  <Button
                    size="lg"
                    colorScheme={displayProduct?.stock > 0 ? "blue" : "gray"}
                    leftIcon={<Icon as={FaShoppingCart} />}
                    onClick={handleAddToCart}
                    isDisabled={!displayProduct?.stock || displayProduct.stock === 0}
                    width="full"
                  >
                    {!displayProduct?.stock || displayProduct.stock === 0 
                      ? "Sin stock disponible" 
                      : "Agregar al carrito"
                    }
                  </Button>
                </Skeleton>

                <Skeleton isLoaded={!isLoading}>
                  <Box>
                    <Text mb={2} fontWeight="medium">Compartir producto:</Text>
                    <HStack spacing={2}>
                      <Tooltip label="Compartir en WhatsApp">
                        <WhatsappShareButton
                          url={window.location.href}
                          title={shareTextWithPrice}
                        >
                          <WhatsappIcon size={40} round />
                        </WhatsappShareButton>
                      </Tooltip>

                      <Tooltip label="Compartir en Facebook">
                        <FacebookShareButton
                          url={window.location.href}
                          quote={shareText}
                        >
                          <FacebookIcon size={40} round />
                        </FacebookShareButton>
                      </Tooltip>

                      <Tooltip label="Compartir en Twitter">
                        <TwitterShareButton
                          url={window.location.href}
                          title={shareText}
                        >
                          <TwitterIcon size={40} round />
                        </TwitterShareButton>
                      </Tooltip>

                      <Tooltip label="Compartir por email">
                        <EmailShareButton
                          url={window.location.href}
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

export default ProductDetail;
