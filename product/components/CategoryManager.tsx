import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  VStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { Category } from '../types';
import { deleteCategory, createCategory } from '../../utils/googleSheets';
import { mutate } from 'swr';

const CATEGORY_LIMIT = 8;

interface CategoryManagerProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  isOpen,
  onClose,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    if (categories.length >= CATEGORY_LIMIT) {
      toast({
        title: "Límite alcanzado",
        description: `No puedes crear más de ${CATEGORY_LIMIT} categorías`,
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await createCategory({ name: newCategoryName.trim() });
      setNewCategoryName('');
      mutate('/api/categories');
      toast({
        title: "Categoría creada",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;

    setIsLoading(true);
    try {
      await deleteCategory(categoryId);
      mutate('/api/categories');
      toast({
        title: "Categoría eliminada",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Gestionar Categorías</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} pb={4}>
            {categories.length >= CATEGORY_LIMIT && (
              <Alert status="warning">
                <AlertIcon />
                Has alcanzado el límite de {CATEGORY_LIMIT} categorías
              </Alert>
            )}
            
            <Box width="100%">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th>Nombre</Th>
                    <Th>Acciones</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {categories.map((category) => (
                    <Tr key={category.id}>
                      <Td>{category.id}</Td>
                      <Td>{category.name}</Td>
                      <Td>
                        <IconButton
                          aria-label="Eliminar categoría"
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          isLoading={isLoading}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            {categories.length < CATEGORY_LIMIT && (
              <Box width="100%" pt={4}>
                <Text mb={2}>Crear nueva categoría</Text>
                <Box display="flex" gap={2}>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nombre de la categoría"
                  />
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="blue"
                    onClick={handleCreateCategory}
                    isLoading={isLoading}
                  >
                    Crear
                  </Button>
                </Box>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 