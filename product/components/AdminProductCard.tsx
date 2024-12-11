import React, { useState } from 'react';
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
  const [expandedTitle, setExpandedTitle] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const handleImageChange = (direction: 'next' | 'prev') => {
    if (!product.images || product.images.length <= 1) return;
    
    setCurrentImageIndex(prevIndex => {
      if (direction === 'next') {
        return prevIndex === product.images.length - 1 ? 0 : prevIndex + 1;
      } else {
        return prevIndex === 0 ? product.images.length - 1 : prevIndex - 1;
      }
    });
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg="white"
      position="relative"
    >
      <Box position="relative" width="100%" paddingTop="100%">
        <Box position="absolute" top={0} left={0} right={0} bottom={0}>
          <Image
            src={product.images[currentImageIndex]}
            alt={product.title}
            objectFit="cover"
            width="100%"
            height="100%"
          />
          {product.images.length > 1 && (
            <>
              <IconButton
                aria-label="Previous image"
                icon={<ChevronLeftIcon />}
                position="absolute"
                left="2"
                top="50%"
                transform="translateY(-50%)"
                onClick={() => handleImageChange('prev')}
                bg="white"
                _hover={{ bg: 'gray.100' }}
              />
              <IconButton
                aria-label="Next image"
                icon={<ChevronRightIcon />}
                position="absolute"
                right="2"
                top="50%"
                transform="translateY(-50%)"
                onClick={() => handleImageChange('next')}
                bg="white"
                _hover={{ bg: 'gray.100' }}
              />
            </>
          )}
        </Box>
      </Box>

      <Box p={4} flex="1" display="flex" flexDirection="column">
        <HStack spacing={2} mb={3}>
          <Badge
            px={3}
            py={1}
            borderRadius="full"
            colorScheme={product.isVisible ? "green" : "red"}
            fontSize="sm"
          >
            {product.isVisible ? "Visible" : "Oculto"}
          </Badge>
          
          <Badge
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
        </HStack>

        <Box mb={2}>
          <Text
            fontWeight="bold"
            fontSize="lg"
            noOfLines={expandedTitle ? undefined : 2}
            onClick={() => setExpandedTitle(!expandedTitle)}
            cursor="pointer"
          >
            {product.title}
          </Text>
          {product.title.length > 50 && (
            <Button
              size="xs"
              variant="link"
              color="blue.500"
              onClick={() => setExpandedTitle(!expandedTitle)}
              mt={1}
            >
              {expandedTitle ? "Ver menos" : "Ver título completo"}
            </Button>
          )}
        </Box>

        <Box mb={4} flex="1">
          <div
            dangerouslySetInnerHTML={{
              __html: expandedDescription
                ? product.description
                : truncateText(product.description, 150)
            }}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: expandedDescription ? 'unset' : 3,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.5em',
              maxHeight: expandedDescription ? 'none' : '4.5em',
            }}
          />
          {product.description.length > 150 && (
            <Button
              size="xs"
              variant="link"
              color="blue.500"
              onClick={() => setExpandedDescription(!expandedDescription)}
              mt={1}
            >
              {expandedDescription ? "Ver menos" : "Ver más"}
            </Button>
          )}
        </Box>

        <Text fontWeight="bold" mb={4}>
          ${product.price.toFixed(2)}
        </Text>

        <Box width="100%">
          <HStack spacing={4} width="100%">
            <Button
              flex={1}
              size="lg"
              colorScheme="red"
              onClick={() => onDelete(product)}
              leftIcon={<Icon as={FaTrash} />}
              borderRadius="md"
            >
              Eliminar
            </Button>
            <Button
              flex={1}
              size="lg"
              colorScheme="blue"
              onClick={() => onEdit(product)}
              borderRadius="md"
            >
              Editar
            </Button>
          </HStack>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminProductCard; 