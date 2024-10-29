import React, { useState } from 'react';
import { Stack, HStack, Heading, Button } from '@chakra-ui/react';
import { CategoryManager } from '../components/CategoryManager';
import { useCategories } from '../../hooks/useCategories';

const AdminScreen = () => {
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const { categories } = useCategories();

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
      </Stack>

      <CategoryManager 
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />
    </>
  );
};

export default AdminScreen;