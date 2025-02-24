import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    console.log('Received delete request for product ID:', id);

    if (!id || typeof id !== 'string') {
      console.error('Invalid ID received:', id);
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

    if (req.method === 'DELETE') {
      try {
        console.log('Fetching current sheet data...');
        // 1. Obtener datos actuales
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'La Libre Web - Catálogo online rev 2021 - products!A:K'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);
        console.log('Found product at row index:', rowIndex);

        if (rowIndex === -1) {
          console.error(`Producto con ID ${id} no encontrado en filas:`, rows.map(r => r[0]));
          return res.status(404).json({ message: 'Product not found' });
        }

        // 2. Obtener el ID de la hoja
        console.log('Getting sheet ID...');
        const sheetsResponse = await sheets.spreadsheets.get({
          spreadsheetId: process.env.GOOGLE_SHEET_ID
        });
        
        const sheetId = sheetsResponse.data.sheets?.[0].properties?.sheetId;
        
        if (!sheetId) {
          console.error('Sheet ID not found');
          return res.status(500).json({ message: 'Sheet ID not found' });
        }

        // Calcular la fila real en Sheets (las filas empiezan en 1, +1 por el header)
        const sheetRowNumber = rowIndex + 2;

        console.log('Deleting row...');
        // 3. Eliminar la fila
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: 'ROWS',
                  startIndex: sheetRowNumber - 1,
                  endIndex: sheetRowNumber
                }
              }
            }]
          }
        });

        console.log('Row deleted successfully');

        // Reindexar IDs
        const reindexResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'La Libre Web - Catálogo online rev 2021 - products!A2:K'
        });

        const currentRows = reindexResponse.data.values || [];
        const updatedIds = currentRows.map((_, index) => [(index + 1).toString()]);

        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: 'La Libre Web - Catálogo online rev 2021 - products!A2:A',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: updatedIds
          }
        });

        return res.status(200).json({ message: 'Product deleted successfully' });
      } catch (error: any) {
        console.error('Detailed error:', error);
        return res.status(500).json({ 
          message: 'Error deleting product', 
          error: error?.message || 'Unknown error',
          details: error?.response?.data || 'No additional details'
        });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('API error:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error?.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
}