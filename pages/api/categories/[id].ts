import type { NextApiRequest, NextApiResponse } from 'next';
import * as googleSheets from '../../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  try {
    switch (req.method) {
      case 'PUT':
        await googleSheets.updateCategory(id, req.body);
        return res.status(200).json({ message: 'Category updated successfully' });

      case 'DELETE':
        await googleSheets.deleteCategory(id);
        return res.status(200).json({ message: 'Category deleted successfully' });

      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Error handling category:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 