import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { isVisible } = req.body;

    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Obtener todos los productos
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'La Libre Web - Catálogo online rev 2021 - products!A2:I',
    });

    const rows = response.data.values || [];
    const productIndex = rows.findIndex(row => row[0] === id);

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Obtener la fila actual del producto
    const currentRow = rows[productIndex];

    // Actualizar la visibilidad en la fila
    currentRow[8] = isVisible ? 'TRUE' : 'FALSE';

    // Actualizar toda la fila en el sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `La Libre Web - Catálogo online rev 2021 - products!A${productIndex + 2}:I${productIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [currentRow]
      }
    });

    return res.status(200).json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 