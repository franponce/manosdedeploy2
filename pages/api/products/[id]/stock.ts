import type { NextApiRequest, NextApiResponse } from 'next';
import { updateProductStock } from '../../../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { id } = req.query;
    const { stock } = req.body;

    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'ID inválido' });
    }

    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({ message: 'Stock inválido' });
    }

    console.log('Actualizando stock:', { id, stock });
    await updateProductStock(id, stock);
    
    return res.status(200).json({ 
      message: 'Stock actualizado correctamente',
      stock 
    });
  } catch (error) {
    console.error('Error en API de stock:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error al actualizar el stock'
    });
  }
} 