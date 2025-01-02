import { useState } from 'react';
import { useStock } from '../../hooks/useStock';
import { stockService } from '../../utils/stockService';
import { Product } from '../../product/types';
import { useToast, Box, Text, Button, Spinner, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper } from '@chakra-ui/react';
import { GetServerSideProps } from 'next';
import { getProducts } from '../../utils/googleSheets';

interface ProductDetailProps {
  product: Product | null;
  error?: string;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, error }) => {
  const { available: stock, isLoading: stockLoading } = useStock(product?.id || null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const toast = useToast();

  if (error) {
    return <Box p={4}>Error: {error}</Box>;
  }
  
  if (!product) {
    return <Box p={4}>Producto no encontrado</Box>;
  }

  const handleAddToCart = async () => {
    try {
      const currentStock = await stockService.getAvailableStock(product.id);
      
      if (currentStock < selectedQuantity) {
        toast({
          title: "Error",
          description: "No hay suficiente stock disponible",
          status: "error",
          duration: 3000,
        });
        return;
      }

      // Aquí deberías tener la función para agregar al carrito
      // onAddToCart({
      //   ...product,
      //   quantity: selectedQuantity
      // });

      toast({
        title: "¡Producto agregado!",
        description: "El producto se agregó al carrito",
        status: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error al verificar stock:', error);
      toast({
        title: "Error",
        description: "No se pudo verificar el stock disponible",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box p={4}>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>{product.title}</Text>
      
      {/* Mostrar stock */}
      <Text color={stock > 0 ? "green.500" : "red.500"} mb={4}>
        {stockLoading ? (
          <Spinner size="sm" />
        ) : stock > 0 ? (
          `${stock} unidad${stock !== 1 ? 'es' : ''} disponible${stock !== 1 ? 's' : ''}`
        ) : (
          "Sin stock disponible"
        )}
      </Text>

      {/* Control de cantidad */}
      <NumberInput
        max={stock}
        min={1}
        value={selectedQuantity}
        onChange={(_, value) => setSelectedQuantity(value)}
        isDisabled={stock === 0}
        mb={4}
      >
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>

      {/* Botón de agregar al carrito */}
      <Button
        colorScheme="blue"
        onClick={handleAddToCart}
        isDisabled={stock === 0}
        isLoading={stockLoading}
        width="full"
      >
        Agregar al carrito
      </Button>
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const products = await getProducts();
    const product = products.find((p: { id: string | string[] | undefined; }) => p.id === params?.id);

    if (!product) {
      return {
        props: {
          product: null,
          error: "Producto no encontrado"
        }
      };
    }

    return {
      props: {
        product,
        error: null
      }
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      props: {
        product: null,
        error: "Error al cargar el producto"
      }
    };
  }
};

export default ProductDetail; 