import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteCategory, updateCategory } from '../../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    switch (req.method) {
      case 'PUT':
        const { name } = req.body;
        if (!name) {
          return res.status(400).json({ message: 'El nombre es requerido' });
        }
        const updatedCategory = await updateCategory(id, name);
        return res.status(200).json(updatedCategory);

      case 'DELETE':
        await deleteCategory(id);
        return res.status(200).json({ message: 'Categoría eliminada exitosamente' });

      default:
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).json({ message: `Método ${req.method} no permitido` });
    }
  } catch (error) {
    console.error('Error en API:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error interno del servidor' 
    });
  }
} 