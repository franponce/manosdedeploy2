import type { NextApiRequest, NextApiResponse } from 'next';
import { getProducts } from '../../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'ID inválido' });
  }

  try {
    const products = await getProducts();
    const product = products.find((p: any) => p.id === id);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error('Error en API:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Error interno del servidor' 
    });
  }
} 