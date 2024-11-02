import type { NextApiRequest, NextApiResponse } from 'next';
import { getProducts, updateProduct } from '../../../utils/googleSheets';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const updates = req.body;

      if (typeof updates.stock !== 'number' || updates.stock < 0) {
        return res.status(400).json({ message: 'El stock no puede ser negativo' });
      }

      await updateProduct({ ...updates, id: String(id) });
      res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Error updating product' });
    }
  } else if (req.method === 'GET') {
    try {
      const { id } = req.query;
      
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const products = await getProducts();
      const product = products.find((p: { id: string; }) => p.id === id);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.status(200).json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Error fetching product' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}