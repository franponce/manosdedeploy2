import useSWR from 'swr';
import { Category } from '../product/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useCategories() {
  const { data: categories, error, mutate } = useSWR<Category[]>('/api/categories', fetcher, {
    refreshInterval: 5000, // Revalidar cada 5 segundos
    revalidateOnFocus: true,
  });

  const createCategory = async (name: string) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Error creating category');
      
      const newCategory = await response.json();
      await mutate([...(categories || []), newCategory], false);
      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error deleting category');
      
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
    deleteCategory,
    mutate,
  };
}