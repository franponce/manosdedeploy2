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
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useProduct } from '../../hooks/useProduct';
import { useSiteInfo } from '../../hooks/useSiteInfo';
import { parseCurrency } from '../../utils/currency';
import { FaArrowLeft, FaShoppingCart } from 'react-icons/fa';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { useCart } from '../../hooks/useCart';
import { CartItem, Product } from '@/product/types';
import CartDrawer from '@/product/components/CartDrawer';

const ProductDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { product, isLoading, error } = useProduct(id as string);
  const { siteInfo } = useSiteInfo();
  const toast = useToast();
  const { saveScrollPosition } = useScrollPosition(id as string);
  const { cart, addToCart, removeFromCart } = useCart();
  const [isCartOpen, toggleCart] = useState(false);

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

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Button
            leftIcon={<Icon as={FaArrowLeft} />}
            onClick={handleBack}
            variant="ghost"
          >
            Volver
          </Button>
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
          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={8}>
            <GridItem>
              {isLoading ? (
                <Skeleton height="400px" borderRadius="lg" />
              ) : (
                <Box
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="md"
                >
                  <Image
                    src={product?.image || '/placeholder.jpg'}
                    alt={product?.title}
                    objectFit="cover"
                    width="100%"
                    height="400px"
                    fallbackSrc="/placeholder.jpg"
                  />
                </Box>
              )}
            </GridItem>

            <GridItem>
              <VStack align="stretch" spacing={6}>
                {isLoading ? (
                  <>
                    <Skeleton height="40px" />
                    <Skeleton height="30px" />
                    <Skeleton height="120px" />
                  </>
                ) : (
                  <>
                    <Heading size="xl">{product?.title}</Heading>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                      {parseCurrency(product?.price || 0)} {siteInfo?.currency}
                    </Text>
                    <Box>
                      <Text
                        dangerouslySetInnerHTML={{
                          __html: product?.description || '',
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
