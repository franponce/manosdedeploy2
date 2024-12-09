import type { NextApiRequest, NextApiResponse } from 'next';
import { getProducts } from '../../utils/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const products = await getProducts();
    console.log('API productos:', products); // Debug
    
    res.status(200).json(products);
  } catch (error) {
    console.error('Error en API products:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
}
