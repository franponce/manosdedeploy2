const { google } = require('googleapis');
const { productService } = require('../services/firebase/products');
const { categoryService } = require('../services/firebase/categories');
require('dotenv').config({ path: '.env.local' });

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const PRODUCT_RANGE = 'La Libre Web - Catálogo online rev 2021 - products!A2:K';
const CATEGORY_RANGE = 'La Libre Web - Catálogo online rev 2021 - categories!A2:B';

async function getAuthClient() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function migrateData() {
  try {
    console.log('Iniciando migración...');
    
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Obtener productos de Google Sheets
    console.log('Obteniendo productos de Google Sheets...');
    const productsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: PRODUCT_RANGE,
    });

    const productRows = productsResponse.data.values || [];
    console.log(`Se encontraron ${productRows.length} productos`);

    // Migrar productos
    for (const row of productRows) {
      try {
        if (!row[1]) continue; // Skip if no title

        const productData = {
          title: row[1],
          description: row[2] || '',
          images: row[3] ? row[3].split('|||') : [],
          price: Number(row[4]) || 0,
          categoryId: row[7] || '',
          isVisible: row[8] === 'TRUE',
          order: row[9] || '',
          stock: Number(row[10]) || 0,
          currency: 'ARS'
        };

        await productService.create(productData);
        console.log(`Producto migrado: ${productData.title}`);
      } catch (error) {
        console.error(`Error migrando producto:`, error);
      }
    }

    // Obtener categorías
    console.log('Obteniendo categorías...');
    const categoriesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: CATEGORY_RANGE,
    });

    const categoryRows = categoriesResponse.data.values || [];
    console.log(`Se encontraron ${categoryRows.length} categorías`);

    // Migrar categorías
    for (const row of categoryRows) {
      try {
        if (!row[1]) continue; // Skip if no name
        await categoryService.create(row[1]);
        console.log(`Categoría migrada: ${row[1]}`);
      } catch (error) {
        console.error(`Error migrando categoría:`, error);
      }
    }

    console.log('Migración completada exitosamente');
  } catch (error) {
    console.error('Error en la migración:', error);
  }
}

migrateData(); 