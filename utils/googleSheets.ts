import { Category, Product } from '../product/types';

// Constantes
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const PRODUCT_RANGE = 'La Libre Web - Catálogo online rev 2021 - products!A2:I';
const CATEGORY_RANGE = 'Categories!A2:B';

// Función de autenticación
async function getAuthClient() {
  if (typeof window !== 'undefined') {
    throw new Error('This function should only be called on the server side');
  }

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

  const { google } = await import('googleapis');
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return auth;
}

// Funciones de API
export async function getProducts(): Promise<Product[]> {
  if (typeof window !== 'undefined') {
    const response = await fetch('/api/products');
    return response.json();
  }

  try {
    const auth = await getAuthClient();
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: PRODUCT_RANGE,
    });

    const rows = response.data.values || [];
    return rows
      .map((row: any[]) => ({
        id: row[0],
        title: row[1],
        description: row[2],
        image: row[3],
        price: parseFloat(row[4]),
        currency: row[5],
        categoryId: row[6],
        isScheduled: row[7] === 'TRUE',
        scheduledPublishDate: row[7] === 'TRUE' ? new Date(row[8]) : null,
        isHidden: row[8] === 'TRUE'
      }))
      .filter((product) => product.title && product.title.trim() !== '');
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function createProduct(product: Product): Promise<void> {
  try {
    const auth = await getAuthClient();
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: PRODUCT_RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          product.id,
          product.title,
          product.description,
          product.image,
          product.price,
          product.currency,
          product.categoryId,
          product.isScheduled,
          product.isHidden
        ]]
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

export async function updateProduct(product: Product): Promise<void> {
  try {
    const auth = await getAuthClient();
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: PRODUCT_RANGE,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === product.id);

    if (rowIndex === -1) throw new Error('Product not found');

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `La Libre Web - Catálogo online rev 2021 - products!A${rowIndex + 2}:I${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          product.id,
          product.title,
          product.description,
          product.image,
          product.price,
          product.currency,
          product.categoryId,
          product.isScheduled,
          product.isHidden
        ]]
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const auth = await getAuthClient();
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: PRODUCT_RANGE,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === id);

    if (rowIndex === -1) throw new Error('Product not found');

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `La Libre Web - Catálogo online rev 2021 - products!A${rowIndex + 2}:I${rowIndex + 2}`,
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

export async function toggleProductVisibility(productIds: string[], hide: boolean): Promise<void> {
  try {
    const auth = await getAuthClient();
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });

    const batchUpdates = productIds.map(id => ({
      range: `La Libre Web - Catálogo online rev 2021 - products!I${parseInt(id) + 1}`,
      values: [[hide ? 'TRUE' : 'FALSE']]
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: batchUpdates
      }
    });
  } catch (error) {
    console.error('Error toggling product visibility:', error);
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const auth = await getAuthClient();
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: CATEGORY_RANGE,
    });

    const rows = response.data.values || [];
    return rows.map((row: any[]) => ({
      id: row[0],
      name: row[1],
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function createCategory(category: { name: string }): Promise<void> {
  try {
    const auth = await getAuthClient();
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });

    const categories = await getCategories();
    const newId = (categories.length + 1).toString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: CATEGORY_RANGE,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newId, category.name]]
      }
    });
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

export async function updateCategory(categoryId: string, category: { name: string }): Promise<void> {
  try {
    const auth = await getAuthClient();
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: CATEGORY_RANGE,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === categoryId);

    if (rowIndex === -1) throw new Error('Category not found');

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Categories!A${rowIndex + 2}:B${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[categoryId, category.name]]
      }
    });
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    const auth = await getAuthClient();
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: CATEGORY_RANGE,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === categoryId);

    if (rowIndex === -1) throw new Error('Category not found');

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `Categories!A${rowIndex + 2}:B${rowIndex + 2}`,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}
