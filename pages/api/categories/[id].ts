import type { NextApiRequest, NextApiResponse } from 'next';
import { updateCategory } from '../../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }
      
      const updatedCategory = await updateCategory(id as string, name);
      res.status(200).json(updatedCategory);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 