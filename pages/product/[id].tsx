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
    if (product && product.stock > 0) {
      const cartItem = cart.find(item => item.id === product.id);
      if (cartItem && cartItem.quantity >= product.stock) {
        toast({
          title: 'No hay suficiente stock',
          description: 'Has alcanzado el límite de stock disponible',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      addToCart(product);
      toast({
        title: 'Producto agregado',
        description: 'El producto se agregó al carrito',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  function handleEditCart(product: Product, action: "increment" | "decrement") {
    if (action === "increment") {
      addToCart(product);
    } else {
      removeFromCart(product);
    }
  }

  const shareText = `¡Mira este producto! ${product?.title} 🛒`;
  const shareTextWithPrice = `¡Descubrí ${product?.title} por ${parseCurrency(product?.price || 0)}! 🛒`;
  const emailSubject = `Te comparto este producto de ${siteInfo?.storeName || 'nuestra tienda'}`;
  const emailBody = `Hola! Encontré este producto que te puede interesar:\n\n${product?.title}\n${window.location.href}`;

  const handleCopyLink = () => {
    const textToCopy = `¡Mirá este producto! ${product?.title}\n${window.location.href}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              {/* Imagen del producto */}
              <Skeleton isLoaded={!isLoading}>
                <Image
                  src={product?.image}
                  alt={product?.title}
                  objectFit="contain"
                  width="100%"
                />
              </Skeleton>
            </GridItem>

            <GridItem>
              <VStack spacing={6} align="stretch">
                {/* 1. Título del producto */}
                <Heading as="h1" size="xl">
                  {product?.title}
                </Heading>

                {/* 2. Precio y disponibilidad */}
                <Box>
                  <Text fontSize="2xl" fontWeight="bold">
                    {parseCurrency(product?.price || 0)}
                  </Text>
                  <Text 
                    color={product?.stock ? "green.500" : "red.500"}
                    fontWeight="medium"
                  >
                    {product?.stock ? `${product.stock} unidades disponibles` : "Sin stock"}
                  </Text>
                </Box>

                {/* 3. Botón de compra principal */}
                <Button
                  size="lg"
                  colorScheme="blue"
                  leftIcon={<Icon as={FaShoppingCart} />}
                  onClick={handleAddToCart}
                  isDisabled={!product?.stock || product.stock === 0}
                >
                  {product?.stock ? "Agregar al carrito" : "Sin stock disponible"}
                </Button>

                {/* 4. Opciones para compartir */}
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

                {/* 5. Descripción del producto */}
                <Box>
                  <Text fontWeight="medium" mb={2}>Descripción:</Text>
                  <Text>{product?.description}</Text>
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
