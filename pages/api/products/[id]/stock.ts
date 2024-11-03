import type { NextApiRequest, NextApiResponse } from 'next';
import { StockManager } from '../../../../utils/stock/stockManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      if (typeof id !== 'string') {
        return res.status(400).json({ message: 'ID inválido' });
      }

      const stock = await StockManager.getCurrentStock(id);
      return res.status(200).json({ stock });
    } catch (error) {
      console.error('Error al obtener stock:', error);
      return res.status(500).json({ message: 'Error al obtener stock' });
    }
  }

  return res.status(405).json({ message: 'Método no permitido' });
} 