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
  HStack,
  useBreakpointValue,
  Stack,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Category } from '../types';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const toast = useToast();
  const { categories, createCategory, deleteCategory, updateCategory } = useCategories();

  // Ajustes responsive
  const modalSize = useBreakpointValue({ base: 'full', md: 'xl' });
  const tableSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const stackDirection = useBreakpointValue({ base: 'column', sm: 'row' }) as 'column' | 'row';

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría no puede estar vacío",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creando categoría:', newCategoryName); // Debug
      const result = await createCategory(newCategoryName);
      console.log('Resultado:', result); // Debug
      
      setNewCategoryName('');
      toast({
        title: "¡Categoría creada!",
        description: `Se creó la categoría "${newCategoryName}" exitosamente`,
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error al crear categoría:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear la categoría",
        status: "error",
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

  const handleEditCategory = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category) {
      setEditingId(id);
      setEditingName(category.name);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) {
      toast({
        title: CATEGORY_CONSTANTS.ERROR_MESSAGES.EMPTY_NAME,
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateCategory(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
      toast({
        title: "Categoría actualizada con éxito",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size={modalSize}
      motionPreset="slideInBottom"
    >
      <ModalOverlay />
      <ModalContent 
        margin={{ base: 0, md: 'auto' }}
        borderRadius={{ base: 0, md: 'md' }}
        h={{ base: '100vh', md: 'auto' }}
      >
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Text fontSize={{ base: 'xl', md: '2xl' }}>Gestionar Categorías</Text>
            <Text 
              fontSize="sm" 
              color={categories.length >= CATEGORY_CONSTANTS.MAX_CATEGORIES ? "orange.500" : "gray.500"}
            >
              {CATEGORY_CONSTANTS.INFO_MESSAGES.LIMIT_INFO(categories.length)}
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton size={buttonSize} />
        <ModalBody>
          <VStack 
            spacing={6} 
            pb={4}
            h={{ base: 'calc(100vh - 140px)', md: 'auto' }}
            overflowY="auto"
          >
            {categories.length >= CATEGORY_CONSTANTS.MAX_CATEGORIES ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize={{ base: 'sm', md: 'md' }}>
                  {CATEGORY_CONSTANTS.INFO_MESSAGES.CANNOT_CREATE}
                </Text>
              </Alert>
            ) : (
              <Box width="100%">
                <InputGroup size={buttonSize}>
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
                  size={buttonSize}
                >
                  Crear Categoría
                </Button>
              </Box>
            )}
            <Box width="100%" overflowX="auto">
              <Table variant="simple" size={tableSize}>
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
                        <Badge colorScheme="purple" fontSize={{ base: 'xs', md: 'sm' }}>
                          {category.id}
                        </Badge>
                      </Td>
                      <Td>
                        {editingId === category.id ? (
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            maxLength={CATEGORY_CONSTANTS.MAX_NAME_LENGTH}
                            size={buttonSize}
                          />
                        ) : (
                          <Text fontSize={{ base: 'sm', md: 'md' }}>{category.name}</Text>
                        )}
                      </Td>
                      <Td>
                        <Stack 
                          direction={stackDirection} 
                          spacing={2}
                          justify="flex-end"
                        >
                          {editingId === category.id ? (
                            <>
                              <Button
                                size={buttonSize}
                                colorScheme="green"
                                onClick={() => handleSaveEdit(category.id)}
                                isLoading={isLoading}
                              >
                                Guardar
                              </Button>
                              <Button
                                size={buttonSize}
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingName('');
                                }}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Tooltip label="Editar categoría">
                                <IconButton
                                  aria-label="Editar categoría"
                                  icon={<EditIcon />}
                                  size={buttonSize}
                                  onClick={() => handleEditCategory(category.id)}
                                />
                              </Tooltip>
                              <Tooltip label="Eliminar categoría">
                                <IconButton
                                  aria-label="Eliminar categoría"
                                  icon={<DeleteIcon />}
                                  colorScheme="red"
                                  size={buttonSize}
                                  isLoading={isLoading}
                                  onClick={() => handleDeleteCategory(category.id)}
                                />
                              </Tooltip>
                            </>
                          )}
                        </Stack>
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