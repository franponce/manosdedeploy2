import type { NextApiRequest, NextApiResponse } from 'next';
import { getProducts } from '../../../utils/googleSheets';
import { Product } from '../../../product/types';
import { cache } from 'react';

const CACHE_KEY = 'all_products';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Product[] | { error: string }>
) {
  try {
    // Intentar obtener del cache
    const cachedData = await cache(async () => {
      return await getProducts();
    })();
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    // Si no hay cache, obtener de Google Sheets
    const products = await getProducts();
    // No necesitamos guardar en cache manualmente ya que cache() lo hace automáticamente
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
} 