import type { NextApiRequest, NextApiResponse } from 'next';
import { getProducts, updateProduct } from '../../../utils/googleSheets';
import { Product } from '@/product/types';
import { StockManager } from '@/utils/stock/stockManager';
import { CacheManager } from '../../../utils/cache/manager';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      const updatedProduct = req.body;

      // Actualizar producto
      await updateProduct(updatedProduct);

      // Si el stock cambió, actualizarlo explícitamente
      if (updatedProduct.stock !== undefined) {
        await StockManager.updateStock(id as string, Number(updatedProduct.stock));
      }
      // Invalidar caches
      await CacheManager.invalidateProducts(id as string);
      await CacheManager.invalidateStock(id as string);

      res.status(200).json({ message: 'Producto actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      res.status(500).json({ error: 'Error al actualizar producto' });
    }
  } else if (req.method === 'GET') {
    try {
      const { id } = req.query;
      
      if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }

      const products = await getProducts();
      const product = products.find((p: Product) => p.id === id);
      
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