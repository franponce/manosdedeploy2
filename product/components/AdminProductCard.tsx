import React from 'react';
import { Box, Badge, Flex, HStack, Text } from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import { useStock } from '../../hooks/useStock';
import { Product } from '../types';

interface AdminProductCardProps {
  product: Product;
}

const AdminProductCard: React.FC<AdminProductCardProps> = ({ product }) => {
  const { available, isLoading: stockLoading } = useStock(product.id);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      position="relative"
    >
      <Box p={4} flex="1" display="flex" flexDirection="column">
        <Flex justify="space-between" align="center" mb={3}>
          <Badge
            width="fit-content"
            px={3}
            py={1}
            borderRadius="full"
            colorScheme={product.isVisible ? "green" : "red"}
            fontSize="sm"
          >
            {product.isVisible ? "Visible" : "Oculto"}
          </Badge>
          
          <Badge
            width="fit-content"
            px={3}
            py={1}
            borderRadius="full"
            colorScheme={stockLoading ? "gray" : available === 0 ? "red" : available <= 5 ? "orange" : "green"}
            fontSize="sm"
          >
            {stockLoading ? (
              "Cargando..."
            ) : available === 0 ? (
              <HStack spacing={1} alignItems="center">
                <WarningIcon boxSize="12px" />
                <Text>Sin stock</Text>
              </HStack>
            ) : (
              `Stock: ${available}`
            )}
          </Badge>
        </Flex>
        
        {/* Resto del contenido de la tarjeta */}
      </Box>
    </Box>
  );
};

export default AdminProductCard; 