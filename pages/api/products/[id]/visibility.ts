import { NextApiRequest, NextApiResponse } from 'next';
import { updateProductVisibility } from '../../../../utils/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { isVisible } = req.body;

    if (typeof id !== 'string' || typeof isVisible !== 'boolean') {
      return res.status(400).json({ message: 'Invalid parameters' });
    }

    await updateProductVisibility(id, isVisible);
    return res.status(200).json({ message: 'Visibility updated successfully' });
  } catch (error) {
    console.error('Error updating product visibility:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 