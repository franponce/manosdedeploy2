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
  SkeletonText,
  useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { Product } from '../../product/types';
import { useSiteInfo } from '../../hooks/useSiteInfo';
import { useProduct } from '@/hooks/useProduct';
import { parseCurrency } from '../../utils/currency';

const ProductDetail: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { product, isLoading, isError } = useProduct(id as string);
  const { siteInfo } = useSiteInfo();
  const { addToCart } = useCart();
  const toast = useToast();

  if (isError) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>No se pudo cargar el producto</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={8}>
        <GridItem>
          {isLoading ? (
            <Skeleton height="400px" borderRadius="lg" />
          ) : (
            <Image
              src={product?.image || 'https://via.placeholder.com/500'}
              alt={product?.title}
              borderRadius="lg"
              objectFit="cover"
            />
          )}
        </GridItem>
        <GridItem>
          <VStack align="stretch" spacing={4}>
            {isLoading ? (
              <>
                <SkeletonText noOfLines={2} spacing="4" skeletonHeight="8" />
                <Skeleton height="40px" />
                <SkeletonText noOfLines={4} spacing="4" />
              </>
            ) : (
              <>
                <Heading as="h1" size="xl">
                  {product?.title}
                </Heading>
                <Text fontSize="2xl" fontWeight="bold">
                  {parseCurrency(product?.price || 0)} {siteInfo?.currency}
                </Text>
                <Box>
                  <div
                    dangerouslySetInnerHTML={{ 
                      __html: product?.description || 'No description available' 
                    }}
                  />
                </Box>
                <Button 
                  colorScheme="blue" 
                  size="lg"
                  onClick={() => {
                    if (product) {
                      addToCart(product);
                      toast({
                        title: "Producto agregado",
                        description: "El producto se agregó al carrito",
                        status: "success",
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
    </Container>
  );
};

export default ProductDetail; 

function useCart(): { addToCart: any; } {
    throw new Error('Function not implemented.');
}
