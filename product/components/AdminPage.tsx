import React from 'react';
import { Box, Center, Spinner } from '@chakra-ui/react';
import { useCategories } from '../../hooks/useCategories';

const AdminPage: React.FC = () => {
  const { 
    categories, 
    isLoading: categoriesLoading, 
    isError: categoriesError 
  } = useCategories();

  // Asegurarse de que categories sea siempre un array
  const safeCategories = Array.isArray(categories) ? categories : [];

  if (categoriesLoading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  if (categoriesError) {
    return (
      <Center>
        Error al cargar las categorías
      </Center>
    );
  }

  return (
    <Box>
      {safeCategories.map(category => (
        <Box key={category.id}>
          {/* ... renderizado de categoría ... */}
        </Box>
      ))}
    </Box>
  );
};

export default AdminPage;