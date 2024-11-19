import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '../../../utils/firebase-admin';
import { productImageService } from '../../../utils/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No authorization token' });
    }

    const token = authHeader.split('Bearer ')[1];
    await adminAuth.verifyIdToken(token);

    const { imageUrl } = req.body;
    
    // Extraer el path de la URL
    const path = decodeURIComponent(imageUrl.split('/o/')[1].split('?')[0]);
    
    await productImageService.delete(path);
    
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Error deleting image' });
  }
} 