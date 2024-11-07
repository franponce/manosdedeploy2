import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
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
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { Category } from '../../product/types';
import { useCategories } from '../../hooks/useCategories';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EditableCategoryProps {
  category: Category;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (name: string) => void;
  onCancel: () => void;
  onDelete: () => void;
}

const EditableCategory: React.FC<EditableCategoryProps> = ({
  category,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}) => {
  const [editedName, setEditedName] = useState(category.name);

  if (isEditing) {
    return (
      <Tr>
        <Td>
          <Badge colorScheme="purple">{category.id}</Badge>
        </Td>
        <Td>
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            size="sm"
          />
        </Td>
        <Td>
          <ButtonGroup size="sm">
            <Button
              colorScheme="green"
              onClick={() => onSave(editedName)}
            >
              Guardar
            </Button>
            <Button onClick={onCancel}>
              Cancelar
            </Button>
          </ButtonGroup>
        </Td>
      </Tr>
    );
  }

  return (
    <Tr>
      <Td>
        <Badge colorScheme="purple">{category.id}</Badge>
      </Td>
      <Td>{category.name}</Td>
      <Td>
        <ButtonGroup size="sm">
          <IconButton
            aria-label="Editar categoría"
            icon={<EditIcon />}
            onClick={onEdit}
          />
          <IconButton
            aria-label="Eliminar categoría"
            icon={<DeleteIcon />}
            colorScheme="red"
            onClick={onDelete}
          />
        </ButtonGroup>
      </Td>
    </Tr>
  );
};

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const { categories, updateCategory } = useCategories();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Error deleting category');
      
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

  const handleEditCategory = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    
    setIsLoading(true);
    try {
      await updateCategory(id, newName.trim());
      setEditingId(null);
      toast({
        title: "Categoría actualizada",
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Gestionar Categorías</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Nombre</Th>
                <Th>Acciones</Th>
              </Tr>
            </Thead>
            <Tbody>
              {categories.map((category: Category) => (
                <EditableCategory
                  key={category.id}
                  category={category}
                  isEditing={editingId === category.id}
                  onEdit={() => setEditingId(category.id)}
                  onSave={(newName) => handleEditCategory(category.id, newName)}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => handleDeleteCategory(category.id)}
                />
              ))}
            </Tbody>
          </Table>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}; 