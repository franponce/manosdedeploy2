import { NextApiRequest, NextApiResponse } from 'next';
import { getProducts, updateProduct, createProduct, deleteProduct } from '../../utils/googleSheets';
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
        const updatedProducts = await getProducts(); // Obtener la lista actualizada de productos
        res.status(201).json(updatedProducts);
      } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product', details: error instanceof Error ? error.message : 'Unknown error' });
      }
      break;

    case 'PUT':
      try {
        await updateProduct(req.body as Product);
        const updatedProducts = await getProducts(); // Obtener la lista actualizada de productos
        res.status(200).json(updatedProducts);
      } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Error al actualizar producto. Revisa las medidas y peso de la imagen que querés cargar' });
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
        const updatedProducts = await getProducts(); // Obtener la lista actualizada de productos
        res.status(200).json(updatedProducts);
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
