import type { NextApiRequest, NextApiResponse } from 'next';
import { getProducts } from '../../../utils/googleSheets';
import { Product } from '../../../product/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Product[] | { error: string }>
) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  try {
    const products = await getProducts();
    
    if (!products || !Array.isArray(products)) {
      console.error('Products is not an array:', products);
      return res.status(200).json([]);
    }

    const validProducts = products
      .filter(p => p && typeof p === 'object')
      .map(p => ({
        id: String(p.id || ''),
        title: String(p.title || ''),
        description: String(p.description || ''),
        image: String(p.image || ''),
        price: Number(p.price || 0),
        currency: String(p.currency || ''),
        categoryId: String(p.categoryId || ''),
        stock: Number(p.stock || 0)
      }));

    return res.status(200).json(validProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(200).json([]);
  }
} 