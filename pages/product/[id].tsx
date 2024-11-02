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
    if (product) {
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
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
        <VStack spacing={6} align="stretch">
          <Grid
            templateColumns={{ base: '1fr', lg: '1fr 1fr' }}
            gap={8}
            mx="auto"
            alignItems="start"
          >
            <GridItem>
              {isLoading ? (
                <Skeleton height="500px" borderRadius="lg" />
              ) : (
                <Box
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="md"
                  bg="white"
                >
                  <Image
                    src={product?.image || '/placeholder.jpg'}
                    alt={product?.title}
                    objectFit="contain"
                    width="100%"
                    height="auto"
                    maxH="500px"
                    p={4}
                  />
                </Box>
              )}
            </GridItem>

            <GridItem>
              <VStack
                align="stretch"
                spacing={6}
                position="sticky"
                top="100px"
              >
                {isLoading ? (
                  <>
                    <Skeleton height="40px" />
                    <Skeleton height="30px" />
                    <Skeleton height="120px" />
                  </>
                ) : (
                  <>
                    <Heading size="xl">{product?.title}</Heading>

                    <HStack spacing={2}>
                      <WhatsappShareButton url={window.location.href} title={product?.title}>
                        <WhatsappIcon size={40} round />
                      </WhatsappShareButton>
                      <FacebookShareButton url={window.location.href} quote={product?.title}>
                        <FacebookIcon size={40} round />
                      </FacebookShareButton>
                      <TwitterShareButton url={window.location.href} title={product?.title}>
                        <TwitterIcon size={40} round />
                      </TwitterShareButton>
                      <EmailShareButton url={window.location.href} subject={product?.title}>
                        <EmailIcon size={40} round />
                      </EmailShareButton>
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

                    <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                      {parseCurrency(product?.price || 0)} {siteInfo?.currency}
                    </Text>

                    <Box
                      borderRadius="md"
                      p={4}
                      bg="gray.50"
                      maxH={{ base: "none", md: "400px" }}
                      overflowY="auto"
                    >
                      <Text
                        dangerouslySetInnerHTML={{
                          __html: product?.description || '',
                        }}
                        sx={{
                          'img': {
                            maxWidth: '100%',
                            height: 'auto'
                          }
                        }}
                      />
                    </Box>

                    <Button
                      size="lg"
                      colorScheme="blue"
                      leftIcon={<Icon as={FaShoppingCart} />}
                      onClick={handleAddToCart}
                    >
                      Agregar al carrito
                    </Button>
                  </>
                )}
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
