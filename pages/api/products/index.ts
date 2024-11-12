import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 