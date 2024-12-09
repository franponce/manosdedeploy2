import React from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';
import { Button, Text, Box } from "@chakra-ui/react";
import { useProductsStock } from '@/hooks/useProductsStock';

interface StoreProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  isLoading: boolean;
}

export const StoreProductCard: React.FC<StoreProductCardProps> = ({
  product,
  onAdd,
  isLoading
}) => {
  // Usamos el hook de stock pasando un array con solo este producto
  const { stocks, isLoading: stockLoading } = useProductsStock([product]);
  const available = stocks[product.id] || 0;

  const renderActionButton = () => {
    if (stockLoading) {
      return (
        <Button
          colorScheme="blue"
          isLoading
          width="100%"
        >
          Cargando...
        </Button>
      );
    }

    if (available === 0) {
      return (
        <Button
          isDisabled
          width="100%"
          bg="gray.100"
          _hover={{ bg: "gray.100" }}
          cursor="not-allowed"
        >
          Agotado
        </Button>
      );
    }

    return (
      <Box>
        <Button
          colorScheme="blue"
          width="100%"
          onClick={() => onAdd(product)}
        >
          Agregar al carrito
        </Button>
        <Text fontSize="sm" color="gray.600" mt={2} textAlign="center">
          Stock disponible: {available}
        </Text>
      </Box>
    );
  };

  return (
    <ProductCard
      product={product}
      onAdd={onAdd}
      isLoading={isLoading}
      onEdit={() => {}}
      onDelete={() => {}}
      onVisibilityToggle={() => {}}
      isAdminView={false}
      actionButton={renderActionButton()}
      available={available}
    />
  );
}; 