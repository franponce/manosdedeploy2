  import { google } from 'googleapis';
  import { Product } from '../product/types';

  let credentials;
  try {
    const credentialsString = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
    credentials = JSON.parse(credentialsString);
  } catch (error) {
    console.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS:', error);
    throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS format');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
  const RANGE = 'A1:E'; // Incluimos la primera fila para los encabezados
  const PRODUCT_LIMIT = 30;

  export async function getProducts(): Promise<Product[]> {
    console.log('GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID);
    console.log('GOOGLE_APPLICATION_CREDENTIALS exists:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS);
  
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        return [];
      }

      // Omitimos la primera fila (encabezados) y mapeamos el resto
      return rows
        .slice(1)
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