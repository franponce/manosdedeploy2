import type { NextApiRequest, NextApiResponse } from 'next';
import { getCategories } from '../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Permitir HEAD para la revalidación de SWR
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', ['GET', 'HEAD']);
    return res.status(405).json({ message: `Método ${req.method} no permitido` });
  }

  try {
    const categories = await getCategories();
    if (!categories) {
      throw new Error('No se pudieron obtener las categorías');
    }

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.status(200).json(categories);
  } catch (error: unknown) {
    console.error('Error en API de categorías:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return res.status(500).json({ message: errorMessage });
  }
} 