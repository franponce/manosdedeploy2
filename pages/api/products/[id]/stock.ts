import type { NextApiRequest, NextApiResponse } from 'next';
import { StockManager } from '../../../../utils/stock/stockManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    if (typeof id !== 'string') {
      return res.status(400).json({ 
        message: 'ID inválido',
        error: 'El ID debe ser una cadena de texto'
      });
    }

    const stock = await StockManager.getCurrentStock(id);
    const numericStock = Number(stock);
    
    if (isNaN(numericStock)) {
      return res.status(200).json({ stock: 0 });
    }

    return res.status(200).json({ stock: numericStock });
  } catch (error) {
    console.error('Error al obtener stock:', error);
    // Devolver 0 en caso de error para evitar errores en el cliente
    return res.status(200).json({ stock: 0 });
  }
} 