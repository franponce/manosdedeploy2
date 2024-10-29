import React, { useState } from 'react';
import { Stack, HStack, Heading, Button } from '@chakra-ui/react';
import { CategoryManager } from '../components/CategoryManager';
import { Category } from '../types';
import { deleteCategory, createCategory } from '../../utils/googleSheets';
import useSWR, { mutate } from 'swr';

const AdminScreen = () => {
  const { data: categories = [] } = useSWR<Category[]>('/api/categories');
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  return (
    <>
      <Stack spacing={4}>
        <HStack justify="space-between">
          <Heading size="lg">Administración</Heading>
          <Button
            colorScheme="purple"
            onClick={() => setIsCategoryManagerOpen(true)}
          >
            Gestionar Categorías
          </Button>
        </HStack>
        {/* ... resto del código */}
      </Stack>

      <CategoryManager 
        categories={categories}
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />
    </>
  );
};

export default AdminScreen;