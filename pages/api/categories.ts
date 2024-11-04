import { NextApiRequest, NextApiResponse } from 'next';
import { getCategories, createCategory, deleteCategory } from '../../utils/googleSheets';
import { withAuth } from '../../utils/apiAuthWrapper';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const categories = await getCategories();
    
    if (!categories) {
      return res.status(404).json({ error: 'No se encontraron categorías' });
    }

    return res.status(200).json(categories);
  } catch (error: unknown) {
    console.error('Error en API de categorías:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    });
  }
}

export default withAuth(handler); 