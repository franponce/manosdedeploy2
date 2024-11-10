import useSWR from 'swr';
import { Category } from '../product/types';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Error al cargar las categorías');
  }
  return response.json();
};

export function useCategories() {
  const { 
    data: categories, 
    error, 
    isLoading,
    mutate 
  } = useSWR<Category[]>('/api/categories', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    onError: (error) => {
      console.error('Error fetching categories:', error);
    }
  });

  const createCategory = async (name: string): Promise<Category> => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear la categoría');
      }

      const newCategory = await response.json();
      await mutate([...(categories || []), newCategory], false);
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar la categoría');
      }

      await mutate(
        categories?.filter(category => category.id !== id),
        false
      );
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al actualizar la categoría');
      }

      const updatedCategory = await response.json();
      await mutate(
        categories?.map(category => 
          category.id === id ? updatedCategory : category
        ),
        false
      );
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