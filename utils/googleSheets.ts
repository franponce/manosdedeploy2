import { Product } from '../product/types';

let googleSheetsApi: any;

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

  const { google } = require('googleapis');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
}

if (typeof window === 'undefined') {
  // Esto solo se ejecutará en el servidor
  const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
  const RANGE = 'A2:E';
  const PRODUCT_LIMIT = 30;

  googleSheetsApi = {
    getProducts: async (): Promise<Product[]> => {
      try {
        console.log('Starting getProducts in googleSheets.ts');
        
        const auth = await getAuthClient();
        console.log('GoogleAuth instance created');

        const { google } = require('googleapis');
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
          .map((row: any[]) => ({
            id: row[0],
            title: row[1],
            description: row[2],
            image: row[3],
            price: parseFloat(row[4]) || 0,
          }))
          .filter((product: Product) => product.title && product.title.trim() !== '');

      } catch (error) {
        console.error('Error fetching products from Google Sheets:', error);
        throw error;
      }
    },

    updateProduct: async (product: Product): Promise<void> => {
      try {
        const auth = await getAuthClient();
        const { google } = require('googleapis');
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
        console.log('Product updated successfully');
      } catch (error) {
        console.error('Error updating product in Google Sheets:', error);
        throw error;
      }
    },

    createProduct: async (product: Product): Promise<string> => {
      try {
        const currentProducts = await googleSheetsApi.getProducts();
        if (currentProducts.length >= PRODUCT_LIMIT) {
          throw new Error(`Product limit of ${PRODUCT_LIMIT} reached. Unable to add more products.`);
        }

        const auth = await getAuthClient();
        const { google } = require('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        const newId = (Math.max(...currentProducts.map((p: Product) => parseInt(p.id)), 0) + 1).toString();
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

        console.log('Product created successfully with ID:', newId);
        return newId;
      } catch (error) {
        console.error('Error creating product in Google Sheets:', error);
        throw error;
      }
    },

    deleteProduct: async (id: string): Promise<void> => {
      try {
        const auth = await getAuthClient();
        const { google } = require('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        // En lugar de eliminar, vamos a limpiar la fila correspondiente
        const values = [['', '', '', '', '']];
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `A${parseInt(id) + 1}:E${parseInt(id) + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
        console.log('Product deleted successfully');
      } catch (error) {
        console.error('Error deleting product from Google Sheets:', error);
        throw error;
      }
    },

    getProductCount: async (): Promise<number> => {
      const products = await googleSheetsApi.getProducts();
      return products.length;
    },
  };
} else {
  // Esto se ejecutará en el cliente
  googleSheetsApi = {
    getProducts: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    updateProduct: async (product: Product) => {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('Failed to update product');
    },
    createProduct: async (product: Product) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },
    deleteProduct: async (id: string) => {
      const response = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete product');
    },
    getProductCount: async () => {
      const products = await googleSheetsApi.getProducts();
      return products.length;
    },
  };
}

export const {
  getProducts,
  updateProduct,
  createProduct,
  deleteProduct,
  getProductCount,
} = googleSheetsApi;