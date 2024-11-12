import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { isVisible } = req.body;

    if (typeof id !== 'string' || typeof isVisible !== 'boolean') {
      return res.status(400).json({ message: 'Invalid parameters' });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Primero encontramos la fila del producto
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'La Libre Web - Catálogo online rev 2021 - products!A:I',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // 2. Actualizamos la columna I con el nuevo valor de visibilidad
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `La Libre Web - Catálogo online rev 2021 - products!I${rowIndex + 2}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[isVisible ? 'TRUE' : 'FALSE']]
      }
    });

    return res.status(200).json({ message: 'Visibility updated successfully' });
  } catch (error) {
    console.error('Error updating product visibility:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 