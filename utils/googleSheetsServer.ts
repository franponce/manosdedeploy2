import { google } from 'googleapis';
import { Product } from '../product/types';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const RANGE = 'A2:E'; // Empezamos desde A2 para omitir los encabezados
const PRODUCT_LIMIT = 30; // Ajusta este número según tus necesidades

async function getAuthClient() {
  const credentials = {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL || '')}`
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
}

export async function getProducts(): Promise<Product[]> {
  try {
    console.log('Starting getProducts in googleSheetsServer.ts');
    
    const auth = await getAuthClient();
    console.log('GoogleAuth instance created');

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });

    console.log('Spreadsheet data fetched');

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    return rows
      .map((row) => ({
        id: row[0],
        title: row[1],
        description: row[2],
        image: row[3],
        price: parseFloat(row[4]) || 0,
      }))
      .filter((product) => product.title && product.title.trim() !== '');

  } catch (error) {
    console.error('Error fetching products from Google Sheets:', error);
    throw error;
  }
}

export async function updateProduct(product: Product): Promise<void> {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const values = [
      [product.id, product.title, product.description, product.image, product.price.toString()],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `A${parseInt(product.id) + 1}:E${parseInt(product.id) + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  } catch (error) {
    console.error('Error updating product in Google Sheets:', error);
    throw error;
  }
}

export async function createProduct(product: Product): Promise<string> {
  try {
    const currentProducts = await getProducts();
    if (currentProducts.length >= PRODUCT_LIMIT) {
      throw new Error(`Product limit of ${PRODUCT_LIMIT} reached. Unable to add more products.`);
    }

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const newId = (Math.max(...currentProducts.map((p) => parseInt(p.id)), 0) + 1).toString();
    const values = [
      [newId, product.title, product.description, product.image, product.price.toString()],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return newId;
  } catch (error) {
    console.error('Error creating product in Google Sheets:', error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // En lugar de eliminar, vamos a limpiar la fila correspondiente
    const values = [['', '', '', '', '']];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `A${parseInt(id) + 1}:E${parseInt(id) + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  } catch (error) {
    console.error('Error deleting product from Google Sheets:', error);
    throw error;
  }
}

export async function getProductCount(): Promise<number> {
  const products = await getProducts();
  return products.length;
}