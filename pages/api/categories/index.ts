import { NextApiRequest, NextApiResponse } from 'next';
import { getCategories, createCategory, deleteCategory } from '../../../utils/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        if (!id || Array.isArray(id)) {
          res.status(400).json({ message: 'Invalid category ID' });
          return;
        }
        await deleteCategory(id);
        res.status(200).json({ message: 'Category deleted successfully' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}