import React, { useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  Box,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Spinner,
  Image,
  useToast,
  Tooltip,
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

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Imagen</Th>
              <Th>Título</Th>
              <Th>Precio</Th>
              <Th>Categoría</Th>
              <Th>Visible</Th>
              <Th>Acciones</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={6}>
                  <Flex justify="center" py={4}>
                    <Spinner />
                  </Flex>
                </Td>
              </Tr>
            ) : (
              filteredProducts?.map((product) => (
                <Tr key={product.id}>
                  <Td>
                    <Image
                      src={product.image}
                      alt={product.title}
                      boxSize="50px"
                      objectFit="cover"
                      borderRadius="md"
                      fallbackSrc="/placeholder-image.jpg"
                    />
                  </Td>
                  <Td>{product.title}</Td>
                  <Td>{parseCurrency(product.price)}</Td>
                  <Td>
                    {categories?.find(cat => cat.id === product.categoryId)?.name || '-'}
                  </Td>
                  <Td>
                    <VisibilityToggle
                      isVisible={product.isVisible}
                      onChange={() => handleVisibilityToggle(product)}
                    />
                  </Td>
                  <Td>
                    <Flex gap={2}>
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
                    </Flex>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
};

export default ProductManagement;
