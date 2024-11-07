import useSWR from 'swr';
import { Category } from '../product/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useCategories() {
  const { data: categories, error, mutate } = useSWR<Category[]>('/api/categories', fetcher);

  const updateCategory = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Error updating category');
      
      const updatedCategory = await response.json();
      await mutate(
        categories?.map((cat: Category) => 
          cat.id === id ? { ...cat, name } : cat
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
    isLoading: !error && !categories,
    isError: error,
    updateCategory,
    mutate,
  };
} 