import React, { useState, useEffect } from 'react';
import {
  Box,
  Badge,
  Text,
  Button,
  HStack,
  IconButton,
  Icon,
  Image,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, WarningIcon } from '@chakra-ui/icons';
import { FaTrash } from 'react-icons/fa';
import { Product } from '../types';
import { useStock } from '@/hooks/useStock';
import { useVisibility } from '@/hooks/useVisibility';
import { VisibilityToggle } from './VisibilityToggle';

interface AdminProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  productImageIndex: number;
  onImageIndexChange: (productId: string, newIndex: number) => void;
}

const AdminProductCard: React.FC<AdminProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  productImageIndex,
  onImageIndexChange,
}) => {
  const { available, isLoading: stockLoading } = useStock(product.id);
  const { isVisible, isLoading: visibilityLoading } = useVisibility(product.id);
  const [expandedTitle, setExpandedTitle] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      position="relative"
    >
      <Box p={4} flex="1" display="flex" flexDirection="column">
        <HStack spacing={2} mb={3}>
          <Badge
            px={3}
            py={1}
            borderRadius="full"
            colorScheme={isVisible ? "green" : "red"}
            fontSize="sm"
          >
            {visibilityLoading ? "Cargando..." : isVisible ? "Visible" : "Oculto"}
          </Badge>
          <VisibilityToggle 
            isVisible={isVisible} 
            productId={product.id}
          />
        </HStack>
        {/* ... resto del código ... */}
      </Box>
    </Box>
  );
};

export default AdminProductCard; 