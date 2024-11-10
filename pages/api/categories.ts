import type { NextApiRequest, NextApiResponse } from 'next';
import { getCategories } from '../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    if (req.method === 'GET') {
      const categories = await getCategories();
      if (!categories) {
        throw new Error('No se pudieron obtener las categorías');
      }
      return res.status(200).json(categories);
    }

    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Método ${req.method} no permitido` });
  } catch (error: unknown) {
    console.error('Error en API de categorías:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return res.status(500).json({ message: errorMessage });
  }
} 