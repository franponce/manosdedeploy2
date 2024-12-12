import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { imageService } from '../../../services/imageService';
import { stockService } from '../../../utils/firebase';
import { googleSheetsApi } from '../../../utils/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    // Primero obtenemos el producto para tener sus imágenes
    const product = await googleSheetsApi.getProductById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Eliminamos el producto del sheet
    await googleSheetsApi.deleteProduct(id);

    // Eliminamos las imágenes asociadas
    if (product.images && product.images.length > 0) {
      try {
        await Promise.all(
          product.images.map((imageUrl: string) => imageService.delete(imageUrl))
        );
      } catch (error) {
        console.error('Error deleting product images:', error);
      }
    }

    // Eliminamos el documento de stock si existe
    try {
      await stockService.initializeStockDocument(id);
      await stockService.updateStock(id, 0);
    } catch (error) {
      console.error('Error deleting stock document:', error);
    }

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 