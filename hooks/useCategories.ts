import useSWR, { KeyedMutator } from 'swr';
import { Category } from '../product/types';

export function useCategories() {
  const { 
    data: categories, 
    error, 
    isLoading,
    mutate 
  } = useSWR<Category[]>('/api/categories');

  const createCategory = async (name: string): Promise<Category> => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Error al crear la categoría');
      const newCategory = await response.json();
      await mutate();
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar la categoría');
      await mutate();
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, name: string): Promise<Category> => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Error al actualizar la categoría');
      const updatedCategory = await response.json();
      await mutate();
      return updatedCategory;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  return {
    categories: categories || [],
    isLoading,
    error,
    createCategory,
    deleteCategory,
    updateCategory,
    mutate
  };
} 