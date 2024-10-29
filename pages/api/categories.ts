import type { NextApiRequest, NextApiResponse } from 'next';
import { getCategories, createCategory, deleteCategory } from '../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        const categories = await getCategories();
        res.status(200).json(categories);
        break;

      case 'POST':
        const newCategory = await createCategory(req.body);
        res.status(201).json(newCategory);
        break;

      case 'DELETE':
        const { id } = req.query;
        console.log('Attempting to delete category with ID:', id);
        
        if (!id || Array.isArray(id)) {
          console.error('Invalid category ID:', id);
          res.status(400).json({ message: 'Invalid category ID' });
          return;
        }

        try {
          await deleteCategory(id);
          console.log('Category deleted successfully:', id);
          res.status(200).json({ message: 'Category deleted successfully' });
        } catch (deleteError) {
          console.error('Error deleting category:', deleteError);
          res.status(500).json({ 
            message: 'Error deleting category', 
            error: deleteError instanceof Error ? deleteError.message : 'Unknown error' 
          });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 