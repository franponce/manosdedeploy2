import type { NextApiRequest, NextApiResponse } from 'next';
import { StockManager } from '../../../../utils/stock/stockManager';
import { CacheManager } from '../../../../utils/cache/manager';
import { CACHE_KEYS } from '../../../../utils/cache/config';

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
    
    return res.status(200).json({ 
      stock: isNaN(numericStock) ? 0 : numericStock,
      lastUpdate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error al obtener stock:', error);
    return res.status(200).json({ 
      stock: 0,
      lastUpdate: new Date().toISOString()
    });
  }
} 