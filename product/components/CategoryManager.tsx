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
  Badge,
  Tooltip,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { Category } from '../types';
import { deleteCategory, createCategory } from '../../utils/googleSheets';
import { mutate } from 'swr';
import { useCategories } from '../../hooks/useCategories';
import { CATEGORY_CONSTANTS } from '../../utils/constants';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { categories, createCategory, deleteCategory } = useCategories();

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: CATEGORY_CONSTANTS.ERROR_MESSAGES.EMPTY_NAME,
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await createCategory(newCategoryName.trim());
      setNewCategoryName('');
      toast({
        title: "¡Categoría creada con éxito! 🎉",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Error inesperado",
        status: "warning",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteCategory(id);
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
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Text fontSize="2xl">Gestionar Categorías</Text>
            <Text fontSize="sm" color={categories.length >= CATEGORY_CONSTANTS.MAX_CATEGORIES ? "orange.500" : "gray.500"}>
              {CATEGORY_CONSTANTS.INFO_MESSAGES.LIMIT_INFO(categories.length)}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} pb={4}>
            {categories.length >= CATEGORY_CONSTANTS.MAX_CATEGORIES ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text>{CATEGORY_CONSTANTS.INFO_MESSAGES.CANNOT_CREATE}</Text>
              </Alert>
            ) : (
              <Box width="100%">
                <InputGroup>
                  <Input
                    placeholder="Nombre de la categoría"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    maxLength={CATEGORY_CONSTANTS.MAX_NAME_LENGTH}
                  />
                  <InputRightElement width="4.5rem">
                    <Text fontSize="xs" color="gray.500">
                      {newCategoryName.length}/{CATEGORY_CONSTANTS.MAX_NAME_LENGTH}
                    </Text>
                  </InputRightElement>
                </InputGroup>
                <Button
                  mt={4}
                  colorScheme="purple"
                  onClick={handleCreateCategory}
                  isLoading={isLoading}
                  isDisabled={!newCategoryName.trim()}
                  width="100%"
                >
                  Crear Categoría
                </Button>
              </Box>
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
                      <Td>
                        <Badge colorScheme="purple">{category.id}</Badge>
                      </Td>
                      <Td>{category.name}</Td>
                      <Td>
                        <Tooltip label="Eliminar categoría">
                          <IconButton
                            aria-label="Eliminar categoría"
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            size="sm"
                            isLoading={isLoading}
                            onClick={() => handleDeleteCategory(category.id)}
                          />
                        </Tooltip>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 