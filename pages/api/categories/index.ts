import { NextApiRequest, NextApiResponse } from 'next';
import { getCategories, createCategory } from '../../../utils/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const categories = await getCategories();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching categories' });
    }
  } else if (req.method === 'POST') {
    try {
      const newCategory = await createCategory(req.body);
      res.status(201).json(newCategory);
    } catch (error) {
      res.status(500).json({ message: 'Error creating category' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}