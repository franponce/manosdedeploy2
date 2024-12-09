import React from 'react';
import ProductCard from './ProductCard';
import { Product } from '../types';
import { Button, Text, Box, VStack, Icon } from "@chakra-ui/react";
import { useProductsStock } from '@/hooks/useProductsStock';
import { FaEye } from 'react-icons/fa';
import { useRouter } from 'next/router';

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
  const router = useRouter();
  const { stocks, isLoading: stockLoading } = useProductsStock([product]);
  const available = stocks[product.id] || 0;

  const handleViewDetail = () => {
    router.push(`/product/${product.id}`);
  };

  const renderActionButton = () => {
    if (stockLoading) {
      return (
        <VStack spacing={2} width="100%">
          <Button
            colorScheme="blue"
            isLoading
            width="100%"
          >
            Cargando...
          </Button>
          <Button
            variant="outline"
            colorScheme="blue"
            width="100%"
            onClick={handleViewDetail}
            leftIcon={<Icon as={FaEye} />}
          >
            Ver detalle
          </Button>
        </VStack>
      );
    }

    return (
      <VStack spacing={2} width="100%">
        <Button
          colorScheme="blue"
          width="100%"
          onClick={() => onAdd(product)}
          isDisabled={available === 0}
        >
          {available === 0 ? "Agotado" : "Agregar al carrito"}
        </Button>
        <Button
          variant="outline"
          colorScheme="blue"
          width="100%"
          onClick={handleViewDetail}
          leftIcon={<Icon as={FaEye} />}
        >
          Ver detalle
        </Button>
        {available > 0 && (
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Stock disponible: {available}
          </Text>
        )}
      </VStack>
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