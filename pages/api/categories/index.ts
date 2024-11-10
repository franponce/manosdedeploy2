import type { NextApiRequest, NextApiResponse } from 'next';
import { getCategories, createCategory, deleteCategory } from '../../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Configurar CORS y caché
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        const categories = await getCategories();
        if (!categories) {
          throw new Error('No se pudieron obtener las categorías');
        }
        return res.status(200).json(categories);

      case 'POST':
        const { name } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
          return res.status(400).json({ 
            message: 'Nombre de categoría inválido' 
          });
        }
        console.log('Creando categoría con nombre:', name); // Debug
        const newCategory = await createCategory({ name: name.trim() });
        
        console.log('Categoría creada:', newCategory); // Debug
        return res.status(201).json(newCategory);

      case 'DELETE':
        const { id } = req.query;
        if (!id || Array.isArray(id)) {
          return res.status(400).json({ message: 'ID de categoría inválido' });
        }
        await deleteCategory(id);
        return res.status(200).json({ message: 'Categoría eliminada exitosamente' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ message: `Método ${req.method} no permitido` });
    }
  } catch (error) {
    console.error('Error detallado en API de categorías:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}