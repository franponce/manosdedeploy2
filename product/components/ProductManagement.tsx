import React from 'react';
import { Box, Grid, Text, Button, Image, VStack, HStack } from '@chakra-ui/react';
import { Product } from '../types';

interface ProductManagementProps {
  products?: Product[];
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onCreateProduct: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  onEditProduct,
  onDeleteProduct,
  onCreateProduct
}) => {
  return (
    <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
      {products?.map((product) => (
        <Box key={product.id} borderWidth={1} borderRadius="lg" overflow="hidden">
          <Image src={product.image} alt={product.title} />
          <VStack p={4} align="start" spacing={2}>
            <Text fontWeight="bold">{product.title}</Text>
            <Text>Precio: ${product.price}</Text>
            <Text>Stock: {product.stock}</Text>
            <HStack spacing={2}>
              <Button size="sm" onClick={() => onEditProduct && onEditProduct(product)}>
                Editar
              </Button>
              <Button size="sm" colorScheme="red" onClick={() => onDeleteProduct && onDeleteProduct(product.id)}>
                Eliminar
              </Button>
            </HStack>
          </VStack>
        </Box>
      ))}
      <Button onClick={onCreateProduct} colorScheme="blue">
        Crear nuevo producto
      </Button>
    </Grid>
  );
};

export default ProductManagement;
