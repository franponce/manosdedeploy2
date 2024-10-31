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
import { FaArrowLeft } from 'react-icons/fa';

const ProductDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { product, isLoading, error } = useProduct(id as string);
  const { siteInfo } = useSiteInfo();
  const toast = useToast();

  const handleBack = () => {
    router.back();
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
          <Box textAlign="center" py={10}>
            <Heading size="lg" mb={4}>
              Producto no encontrado
            </Heading>
            <Text mb={6}>
              Lo sentimos, no pudimos encontrar el producto que buscas.
            </Text>
            <Button colorScheme="blue" onClick={() => router.push('/')}>
              Ir al inicio
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
        >
          Volver
        </Button>

        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={8}>
          <GridItem>
            {isLoading ? (
              <Skeleton height="400px" borderRadius="lg" />
            ) : (
              <Image
                src={product?.image || '/placeholder.jpg'}
                alt={product?.title}
                borderRadius="lg"
                objectFit="cover"
                width="100%"
                height="400px"
                fallbackSrc="/placeholder.jpg"
              />
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
                    onClick={() => {
                      if (product) {
                        // Aquí iría la lógica para agregar al carrito
                        toast({
                          title: 'Producto agregado',
                          description: 'El producto se agregó al carrito',
                          status: 'success',
                          duration: 3000,
                          isClosable: true,
                        });
                      }
                    }}
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
