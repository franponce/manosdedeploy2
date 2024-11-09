import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getAuthClient } from '../../../utils/googleAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { products } = req.body;
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Actualizar el orden en la hoja de cálculo
    const values = products.map((product: any, index: number) => [
      product.id,
      product.title,
      product.description,
      product.image,
      product.price,
      product.currency,
      product.isScheduled,
      product.scheduledPublishDate,
      product.categoryId,
      product.createdAt,
      index // Posición para ordenar
    ]);

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Products!A2:K', // Ajusta según tu estructura
      valueInputOption: 'RAW',
      requestBody: {
        values
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating product order:', error);
    res.status(500).json({ error: 'Failed to update product order' });
  }
} 