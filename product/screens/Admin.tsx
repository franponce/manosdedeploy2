import React from 'react';
import { Stack, HStack, Heading } from '@chakra-ui/react';
import { CategoryManager } from '../components/CategoryManager';
import { Category } from '../types';
import { deleteCategory, createCategory } from '../../utils/googleSheets';
import useSWR, { mutate } from 'swr';

const AdminScreen = () => {
  const { data: categories = [] } = useSWR<Category[]>('/api/categories');

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    // Revalidar los datos después de eliminar
    mutate('/api/categories');
  };

  const handleCreateCategory = async (name: string) => {
    await createCategory({ name });
    // Revalidar los datos después de crear
    mutate('/api/categories');
  };

  return (
    <>
      <Stack spacing={4}>
        <HStack justify="space-between">
          <Heading size="lg">Administración</Heading>
          <CategoryManager 
            categories={categories}
            onDeleteCategory={handleDeleteCategory}
            onCreateCategory={handleCreateCategory}
          />
        </HStack>
        {/* ... resto del código */}
      </Stack>
    </>
  );
};

export default AdminScreen;