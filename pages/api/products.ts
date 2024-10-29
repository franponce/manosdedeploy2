import type { NextApiRequest, NextApiResponse } from 'next';
import { createProduct, updateProduct, deleteProduct, getProducts } from '../../utils/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
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
        console.log('Received POST request with body:', req.body);
        try {
          const newProductId = await createProduct(req.body);
          console.log('Product created successfully with ID:', newProductId);
          return res.status(200).json(newProductId);
        } catch (error) {
          console.error('Error in createProduct:', error);
          return res.status(500).json({ 
            error: 'Failed to create product', 
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
        break;

      case 'PUT':
        try {
          await updateProduct(req.body);
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
  } catch (error) {
    console.error('Unexpected error in API handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
