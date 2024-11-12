import { NextApiRequest, NextApiResponse } from 'next';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../utils/googleSheets';
import { Product } from '../../product/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const products = await getProducts();
        res.status(200).json(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
      }
      break;

    case 'POST':
      try {
        const productData = req.body as Product;
        if (productData.scheduledPublishDate) {
          productData.scheduledPublishDate = new Date(productData.scheduledPublishDate);
        }
        const newProduct = await createProduct(productData);
        res.status(201).json(newProduct);
      } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product', details: error instanceof Error ? error.message : 'Unknown error' });
      }
      break;

    case 'PUT':
      try {
        await updateProduct(req.body as Product);
        res.status(200).json({ message: 'Product updated successfully' });
      } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ 
          error: 'Error al actualizar producto', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;
        if (typeof id !== 'string') {
          res.status(400).json({ error: 'Invalid product ID' });
          return;
        }
        await deleteProduct(id);
        res.status(200).json({ message: 'Product deleted successfully' });
      } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
