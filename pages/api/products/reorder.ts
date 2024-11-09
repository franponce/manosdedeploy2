import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../utils/apiAuthWrapper';
import { updateProductOrder } from '../../../utils/googleSheets';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { products } = req.body;
    await updateProductOrder(products);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error reordering products:', error);
    res.status(500).json({ error: 'Failed to reorder products' });
  }
}

export default withAdminAuth(handler); 