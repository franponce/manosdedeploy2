import type { NextApiRequest, NextApiResponse } from 'next';
import { StockManager } from '../../../../utils/stock/stockManager';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'ID de producto inválido' });
  }

  if (req.method === 'GET') {
    try {
      const stock = await StockManager.getCurrentStock(id);
      res.status(200).json({ stock });
    } catch (error) {
      console.error('Error en GET stock:', error);
      res.status(500).json({ message: 'Error al obtener el stock' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { stock } = req.body;

      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ message: 'Stock inválido' });
      }

      await StockManager.updateStock(id, stock);
      res.status(200).json({ 
        message: 'Stock actualizado correctamente',
        stock: stock
      });
    } catch (error) {
      console.error('Error en PUT stock:', error);
      res.status(500).json({ message: 'Error al actualizar el stock' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).json({ message: `Método ${req.method} no permitido` });
  }
} 