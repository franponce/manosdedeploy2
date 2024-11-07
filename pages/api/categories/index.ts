import type { NextApiRequest, NextApiResponse } from 'next';
import { getCategories, createCategory, deleteCategory } from '../../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Manejar OPTIONS para CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        const categories = await getCategories();
        return res.status(200).json(categories);

      case 'POST':
        const { name } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
          return res.status(400).json({ 
            message: 'Nombre de categoría inválido' 
          });
        }
        
        console.log('Creando categoría con nombre:', name); // Debug
        const newCategory = await createCategory(name.trim());
        
        // Asegurarnos que la respuesta incluya tanto id como name
        const response = {
          id: newCategory.id,
          name: name.trim()
        };
        
        console.log('Categoría creada:', response); // Debug
        return res.status(201).json(response);

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
    console.error('Error en API:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error interno del servidor' 
    });
  }
}