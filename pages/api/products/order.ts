import type { NextApiRequest, NextApiResponse } from 'next';
import { updateProductOrder } from '../../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { orderedIds } = req.body;
    await updateProductOrder(orderedIds);
    res.status(200).json({ message: 'Order updated successfully' });
  } catch (error) {
    console.error('Error updating product order:', error);
    res.status(500).json({ message: 'Error updating product order' });
  }
} 