import type { NextApiRequest, NextApiResponse } from 'next';
import { StockManager } from '../../../../utils/stock/stockManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      if (typeof id !== 'string') {
        return res.status(400).json({ 
          message: 'ID inválido',
          error: 'El ID debe ser una cadena de texto'
        });
      }

      const stock = await StockManager.getCurrentStock(id);
      
      // Asegurarse de que el stock sea un número
      const numericStock = Number(stock);
      if (isNaN(numericStock)) {
        throw new Error('El stock no es un número válido');
      }

      return res.status(200).json({ stock: numericStock });
    } catch (error) {
      console.error('Error al obtener stock:', error);
      return res.status(500).json({ 
        message: 'Error al obtener stock',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  return res.status(405).json({ message: 'Método no permitido' });
} 