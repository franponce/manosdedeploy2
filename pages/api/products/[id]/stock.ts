import type { NextApiRequest, NextApiResponse } from 'next';
import { updateProductStock, getProductById } from '../../../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    if (req.method === 'GET') {
      const product = await getProductById(id);
      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
      return res.status(200).json({ stock: product.stock });
    }

    if (req.method === 'PUT') {
      const { stock } = req.body;
      
      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ message: 'Stock inválido' });
      }

      await updateProductStock(id, stock);
      return res.status(200).json({ message: 'Stock actualizado', stock });
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ message: `Método ${req.method} no permitido` });
  } catch (error) {
    console.error('Error en API de stock:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
} 