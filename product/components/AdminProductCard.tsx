import React from 'react';
import { 
  Box, 
  Badge, 
  Flex, 
  HStack, 
  Text,
  Image,
  AspectRatio,
  Button,
  Stack
} from '@chakra-ui/react';
import { WarningIcon } from '@chakra-ui/icons';
import { useStock } from '../../hooks/useStock';
import { Product } from '../types';
import { parseCurrency } from '../../utils/currency';
import ImageCarousel from './ImageCarousel';

interface AdminProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const AdminProductCard: React.FC<AdminProductCardProps> = ({ 
  product,
  onEdit,
  onDelete
}) => {
  const { available, isLoading: stockLoading } = useStock(product.id);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      position="relative"
    >
      <AspectRatio ratio={1}>
        <Box position="relative">
          <ImageCarousel 
            images={product.images}
          />
        </Box>
      </AspectRatio>

      <Box p={4}>
        <Stack spacing={2}>
          <Flex justify="space-between" align="center">
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

          <Text
            fontWeight="bold"
            fontSize="lg"
            noOfLines={2}
          >
            {product.title}
          </Text>

          <Text
            color="gray.600"
            fontSize="sm"
            noOfLines={3}
          >
            {product.description}
          </Text>

          <Text fontWeight="bold" fontSize="xl">
            {parseCurrency(product.price)}
          </Text>

          <HStack spacing={2} mt={2}>
            <Button
              size="sm"
              colorScheme="red"
              onClick={() => onDelete(product)}
              flex={1}
            >
              Eliminar
            </Button>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => onEdit(product)}
              flex={1}
            >
              Editar
            </Button>
          </HStack>
        </Stack>
      </Box>
    </Box>
  );
};

export default AdminProductCard; 