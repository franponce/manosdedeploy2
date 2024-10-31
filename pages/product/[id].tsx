import React from 'react';
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
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useProduct } from '../../hooks/useProduct';
import { useSiteInfo } from '../../hooks/useSiteInfo';
import { parseCurrency } from '../../utils/currency';
import { FaArrowLeft, FaShoppingCart } from 'react-icons/fa';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { useCart } from '../../hooks/useCart';

const ProductDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { product, isLoading, error } = useProduct(id as string);
  const { siteInfo } = useSiteInfo();
  const toast = useToast();
  const { saveScrollPosition } = useScrollPosition(id as string);
  const { addToCart } = useCart();

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
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Button
          leftIcon={<Icon as={FaArrowLeft} />}
          onClick={handleBack}
          variant="ghost"
          alignSelf="flex-start"
        >
          Volver
        </Button>

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
  );
};

export default ProductDetail;
