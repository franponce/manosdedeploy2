import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { googleSheetsApi } from '../../../utils/googleSheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    if (req.method === 'DELETE') {
      try {
        await googleSheetsApi.deleteProduct(id);
        return res.status(200).json({ message: 'Product deleted successfully' });
      } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ 
          message: 'Error deleting product',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Obtener datos actuales
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'La Libre Web - Catálogo online rev 2021 - products!A:I',
    });

    const rows = response.data.values || [];
    const productIndex = rows.findIndex(row => row[0] === id);

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (req.method === 'PUT') {
      const product = req.body;
      
      // Actualizar la fila existente
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `La Libre Web - Catálogo online rev 2021 - products!A${productIndex + 2}:I${productIndex + 2}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            product.id,
            product.title,
            product.description,
            product.image,
            product.price.toString(),
            product.scheduledPublishDate || '',
            product.isScheduled ? 'TRUE' : 'FALSE',
            product.categoryId || '',
            product.isVisible ? 'TRUE' : 'FALSE'
          ]]
        }
      });

      // Verificar la actualización
      const verifyResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `La Libre Web - Catálogo online rev 2021 - products!A${productIndex + 2}:I${productIndex + 2}`,
      });

      if (!verifyResponse.data.values?.[0]) {
        throw new Error('Failed to verify update');
      }

      return res.status(200).json({ message: 'Product updated successfully' });
    }

    // GET request
    const productData = rows[productIndex];
    const product = {
      id: productData[0],
      title: productData[1],
      description: productData[2],
      image: productData[3],
      price: parseFloat(productData[4]) || 0,
      scheduledPublishDate: productData[5] || null,
      isScheduled: productData[6] === 'TRUE',
      categoryId: productData[7] || '',
      isVisible: productData[8] ? productData[8].toUpperCase() === 'TRUE' : true,
    };

    return res.status(200).json(product);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 