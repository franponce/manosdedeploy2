import useSWR from 'swr';
import { Category } from '../product/types';
import { CATEGORY_CONSTANTS } from '../utils/constants';

// Definir interfaz para el error personalizado
interface CustomError extends Error {
  info?: any;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const customError = new Error('Error al obtener categorías') as CustomError;
    customError.info = await response.json();
    throw customError;
  }
  return response.json();
};

export function useCategories() {
  const { data: categories, error, mutate } = useSWR<Category[]>(
    '/api/categories',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 5000);
      },
    }
  );

  const createCategory = async (name: string) => {
    try {
      // Validar longitud
      if (name.length > CATEGORY_CONSTANTS.MAX_NAME_LENGTH) {
        throw new Error(CATEGORY_CONSTANTS.ERROR_MESSAGES.NAME_TOO_LONG);
      }

      // Validar duplicados
      const existingCategory = categories?.find(
        cat => cat.name.toLowerCase() === name.toLowerCase()
      );
      
      if (existingCategory) {
        throw new Error(CATEGORY_CONSTANTS.ERROR_MESSAGES.DUPLICATE);
      }

      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
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