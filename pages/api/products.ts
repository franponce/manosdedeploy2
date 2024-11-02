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
          const product = req.body;
          // Validar el stock
          if (typeof product.stock !== 'number' || product.stock < 0) {
            return res.status(400).json({ 
              error: 'Stock inválido',
              details: 'El stock debe ser un número mayor o igual a 0'
            });
          }

          await updateProduct(product);
          
          // Invalidar el cache de SWR
          res.setHeader('Cache-Control', 'no-cache');
          
          res.status(200).json({ 
            message: 'Producto actualizado correctamente',
            product 
          });
        } catch (error) {
          console.error('Error updating product:', error);
          res.status(500).json({ 
            error: 'Error al actualizar producto', 
            details: error instanceof Error ? error.message : 'Error desconocido' 
          });
        }
        break;

      case 'DELETE':
        try {
          const { id } = req.query;
          if (typeof id !== 'string') {
            res.status(400).json({ error: 'ID de producto inválido' });
            return;
          }

          // Validar que el ID es un número válido
          const numericId = parseInt(id);
          if (isNaN(numericId) || numericId < 1) {
            res.status(400).json({ error: 'ID de producto inválido' });
            return;
          }

          await deleteProduct(id);
          
          // Esperar un momento para asegurar la sincronización
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          res.status(200).json({ 
            message: 'Producto eliminado exitosamente',
            deletedId: id 
          });
        } catch (error) {
          console.error('Error al eliminar producto:', error);
          res.status(500).json({ 
            error: 'Error al eliminar producto',
            details: error instanceof Error ? error.message : 'Error desconocido'
          });
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
