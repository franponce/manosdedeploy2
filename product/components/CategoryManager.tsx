import React from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Text,
  Button,
  HStack,
} from '@chakra-ui/react';
import { DeleteIcon, AddIcon, WarningIcon } from '@chakra-ui/icons';
import { Category } from '../types';

const CATEGORY_LIMIT = 8;

interface CategoryManagerProps {
  categories: Category[];
  onDeleteCategory: (id: string) => Promise<void>;
  onCreateCategory: (name: string) => Promise<void>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onDeleteCategory,
  onCreateCategory,
}) => {
  const toast = useToast();
  const remainingCategories = CATEGORY_LIMIT - categories.length;

  const handleDelete = async (id: string) => {
    try {
      await onDeleteCategory(id);
      toast({
        title: "Categoría eliminada",
        status: "success",
        duration: 3000,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error al eliminar categoría",
        description: errorMessage,
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={remainingCategories <= 2 ? <WarningIcon color="orange.500" /> : undefined}
      >
        Gestionar Categorías
      </MenuButton>
      <MenuList>
        {categories.map((category) => (
          <MenuItem key={category.id}>
            <HStack justify="space-between" width="100%">
              <Text>{category.name}</Text>
              <IconButton
                aria-label="Eliminar categoría"
                icon={<DeleteIcon />}
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(category.id)}
              />
            </HStack>
          </MenuItem>
        ))}
        {remainingCategories > 0 ? (
          <MenuItem 
            icon={<AddIcon />}
            onClick={() => {/* Implementar lógica para crear categoría */}}
          >
            Crear nueva categoría
          </MenuItem>
        ) : (
          <MenuItem icon={<WarningIcon color="orange.500" />} isDisabled>
            Límite de categorías alcanzado ({CATEGORY_LIMIT})
          </MenuItem>
        )}
      </MenuList>
    </Menu>
  );
}; 