import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['GET', 'POST', 'PUT'].includes(req.method || '')) {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    if (req.method === 'PUT') {
      const product = req.body;
      
      // Encontrar la fila del producto
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'La Libre Web - Catálogo online rev 2021 - products!A:I',
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === product.id);

      if (rowIndex === -1) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Actualizar la fila con los nuevos valores
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `La Libre Web - Catálogo online rev 2021 - products!A${rowIndex + 2}:I${rowIndex + 2}`,
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

      return res.status(200).json({ message: 'Product updated successfully' });
    }

    if (req.method === 'GET') {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'La Libre Web - Catálogo online rev 2021 - products!A2:I',
      });

      const rows = response.data.values || [];
      const products = rows.map(row => ({
        id: row[0],
        title: row[1],
        description: row[2],
        image: row[3],
        price: parseFloat(row[4]) || 0,
        scheduledPublishDate: row[5] || null,
        isScheduled: row[6] === 'TRUE',
        categoryId: row[7] || '',
        isVisible: row[8] ? row[8].toUpperCase() === 'TRUE' : true,
      }));

      return res.status(200).json(products);
    }

    // POST method handling here if needed...

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 