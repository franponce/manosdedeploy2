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

    // 1. Primero obtenemos todos los productos
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'La Libre Web - Catálogo online rev 2021 - products!A2:I',
    });

    const rows = response.data.values || [];
    
    // 2. Encontrar el índice exacto del producto por ID
    const productIndex = rows.findIndex(row => row[0] === id);

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // 3. Calcular la fila real en la hoja (añadir 2 porque empezamos desde A2)
    const rowNumber = productIndex + 2;

    // 4. Actualizar solo la columna I para ese producto específico
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `La Libre Web - Catálogo online rev 2021 - products!I${rowNumber}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[isVisible ? 'TRUE' : 'FALSE']]
      }
    });

    // 5. Verificar que la actualización fue exitosa
    const verificationResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `La Libre Web - Catálogo online rev 2021 - products!I${rowNumber}`,
    });

    const updatedValue = verificationResponse.data.values?.[0]?.[0];
    
    if (updatedValue !== (isVisible ? 'TRUE' : 'FALSE')) {
      throw new Error('Verification failed: Value was not updated correctly');
    }

    return res.status(200).json({ 
      message: 'Visibility updated successfully',
      productId: id,
      isVisible: isVisible,
      rowNumber: rowNumber
    });

  } catch (error) {
    console.error('Error updating product visibility:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 