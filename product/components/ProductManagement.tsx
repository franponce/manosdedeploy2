import React, { useState } from 'react';
import {
  Grid,
  Box,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  useToast,
  Text,
  Badge,
  IconButton,
  Tooltip,
  VStack,
  HStack,
  Image,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaEdit, FaTrash, FaCopy } from 'react-icons/fa';
import { Product } from '@/product/types';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { VisibilityToggle } from './VisibilityToggle';
import { parseCurrency } from '@/utils/currency';

interface ProductManagementProps {
  onCreateProduct: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ onCreateProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const toast = useToast();

  const { products, isLoading, updateProductVisibility } = useProducts();
  const { categories } = useCategories();

  const handleVisibilityToggle = async (product: Product) => {
    try {
      await updateProductVisibility(product, !product.isVisible);
      toast({
        title: 'Visibilidad actualizada',
        description: `Producto ${!product.isVisible ? 'visible' : 'oculto'} en la tienda`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la visibilidad',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Box>
      <Flex gap={4} mb={4}>
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        <Select
          placeholder="Todas las categorías"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          maxW="200px"
        >
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </Flex>

      {isLoading ? (
        <Flex justify="center" py={4}>
          <Spinner />
        </Flex>
      ) : (
        <Grid
          templateColumns="repeat(auto-fill, minmax(250px, 1fr))"
          gap={6}
          padding={4}
        >
          {filteredProducts?.map((product) => (
            <Box
              key={product.id}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              position="relative"
            >
              <Image
                src={product.image}
                alt={product.title}
                height="200px"
                width="100%"
                objectFit="cover"
                fallbackSrc="/placeholder-image.jpg"
              />
              
              <Box position="absolute" top={2} right={2}>
                <VisibilityToggle
                  isVisible={product.isVisible}
                  onChange={() => handleVisibilityToggle(product)}
                />
              </Box>

              <VStack p={4} align="stretch" spacing={2}>
                <Text fontWeight="bold" noOfLines={2}>
                  {product.title}
                </Text>
                <Text color="blue.600" fontSize="xl">
                  {parseCurrency(product.price)}
                </Text>
                <Badge colorScheme="purple">
                  {categories?.find(cat => cat.id === product.categoryId)?.name || 'Sin categoría'}
                </Badge>

                <HStack spacing={2} justify="flex-end">
                  <Tooltip label="Editar">
                    <IconButton
                      aria-label="Editar producto"
                      icon={<FaEdit />}
                      size="sm"
                      onClick={() => {/* Implementar edición */}}
                    />
                  </Tooltip>
                  <Tooltip label="Duplicar">
                    <IconButton
                      aria-label="Duplicar producto"
                      icon={<FaCopy />}
                      size="sm"
                      onClick={() => {/* Implementar duplicación */}}
                    />
                  </Tooltip>
                  <Tooltip label="Eliminar">
                    <IconButton
                      aria-label="Eliminar producto"
                      icon={<FaTrash />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => {/* Implementar eliminación */}}
                    />
                  </Tooltip>
                </HStack>
              </VStack>
            </Box>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ProductManagement;
