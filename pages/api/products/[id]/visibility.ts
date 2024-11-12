import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '@/utils/apiAuthWrapper';
import { updateProductVisibility } from '@/utils/googleSheets';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { isVisible } = req.body;

    if (typeof isVisible !== 'boolean') {
      return res.status(400).json({ message: 'isVisible debe ser un booleano' });
    }

    await updateProductVisibility(id as string, isVisible);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating product visibility:', error);
    res.status(500).json({ message: 'Error updating product visibility' });
  }
}

export default withAdminAuth(handler); 