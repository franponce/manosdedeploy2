import useSWR, { KeyedMutator } from 'swr';
import { Category } from '../product/types';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Error en la petición');
  return res.json();
});

export function useCategories() {
  const { data: categories, error, mutate } = useSWR<Category[]>('/api/categories', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  });

  const createCategory = async (name: string) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error creating category');
      }
      
      const newCategory = await response.json();
      await mutate([...(categories || []), newCategory], false);
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error updating category');
      }

      const updatedCategory = await response.json();
      await mutate(
        categories?.map(cat => cat.id === id ? updatedCategory : cat),
        false
      );
      return updatedCategory;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error deleting category');
      }
      
      await mutate(
        categories?.filter(cat => cat.id !== id),
        false
      );
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  return {
    categories: categories || [],
    isLoading: !error && !categories,
    isError: error,
    createCategory,
    updateCategory,
    deleteCategory,
    mutate,
  };
} 