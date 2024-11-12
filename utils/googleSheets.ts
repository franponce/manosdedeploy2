import { Category, Product } from '../product/types';
import { google } from 'googleapis';
import { formatDateToString, parseStringToDate } from './dates';

let googleSheetsApi: any;

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

if (typeof window === 'undefined') {
  // Constantes del servidor
  const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
  const PRODUCT_RANGE = 'La Libre Web - Catálogo online rev 2021 - products!A2:I';
  const CATEGORY_RANGE = 'Categories!A2:B';
  const PRODUCT_LIMIT = 30;

  const formatLocalDateTime = (date: Date): string => {
    try {
      return date.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(',', '');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const checkAndUpdateScheduledProducts = async (): Promise<void> => {
    try {
      const auth = await getAuthClient();
      const { google } = await import('googleapis');
      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: PRODUCT_RANGE,
      });

      const rows = response.data.values;
      if (!rows) return;

      const now = new Date();
      const updates: {
        range: string;
        values: string[][];
      }[] = [];

      rows.forEach((row, index) => {
        if (row[6] === 'TRUE' && row[5]) {
          const scheduledDate = new Date(row[5].replace(' ', 'T'));
          if (scheduledDate <= now) {
            updates.push({
              range: `La Libre Web - Catálogo online rev 2021 - products!F${index + 2}:G${index + 2}`,
              values: [['', 'FALSE']]
            });
          }
        }
      });

      if (updates.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updates
          }
        });
      }
    } catch (error) {
      console.error('Error checking scheduled products:', error);
    }
  };

  const formatProduct = (row: any[]): Product => {
    // Convertir la fecha de publicación programada a string si existe
    const scheduledDate = row[10] ? row[10].toString() : null;

    return {
      id: row[0],
      title: row[1],
      description: row[2],
      price: Number(row[3]),
      image: row[4],
      categoryId: row[5],
      createdAt: row[6],
      updatedAt: row[7],
      isVisible: row[8] === 'TRUE',
      isScheduled: row[9] === 'TRUE',
      scheduledPublishDate: scheduledDate,
      currency: row[11] || 'ARS'
    };
  };

  googleSheetsApi = {
    getProducts: async (): Promise<Product[]> => {
      try {
        await checkAndUpdateScheduledProducts();

        const auth = await getAuthClient();
        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: PRODUCT_RANGE,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
          return [];
        }

        return rows.map(formatProduct);
      } catch (error) {
        console.error('Error fetching products from Google Sheets:', error);
        throw error;
      }
    },

    updateProduct: async (product: Product): Promise<Product> => {
      try {
        const auth = await getAuthClient();
        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: PRODUCT_RANGE,
        });

        const rows = response.data.values;
        if (!rows) throw new Error('No products found');

        const rowIndex = rows.findIndex(row => row[0] === product.id);
        if (rowIndex === -1) throw new Error('Product not found');

        // La fecha programada ya viene como string desde el producto
        const values = [
          [
            product.id,
            product.title,
            product.description,
            product.price.toString(),
            product.image,
            product.categoryId || '',
            rows[rowIndex][6], // mantener createdAt original
            new Date().toISOString(), // actualizar updatedAt
            product.isVisible ? 'TRUE' : 'FALSE',
            product.isScheduled ? 'TRUE' : 'FALSE',
            product.scheduledPublishDate || '', // ya es string o null
            product.currency || 'ARS'
          ]
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `La Libre Web - Catálogo online rev 2021 - products!A${rowIndex + 2}:L${rowIndex + 2}`,
          valueInputOption: 'RAW',
          requestBody: { values },
        });

        return product;
      } catch (error) {
        console.error('Error updating product:', error);
        throw error;
      }
    },

    createProduct: async (product: Product): Promise<Product> => {
      try {
        const auth = await getAuthClient();
        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        const values = [
          [
            product.id,
            product.title,
            product.description,
            product.price.toString(),
            product.image,
            product.categoryId || '',
            new Date().toISOString(), // createdAt
            new Date().toISOString(), // updatedAt
            product.isVisible ? 'TRUE' : 'FALSE',
            product.isScheduled ? 'TRUE' : 'FALSE',
            product.scheduledPublishDate || '', // ya es string o null
            product.currency || 'ARS'
          ]
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: PRODUCT_RANGE,
          valueInputOption: 'RAW',
          requestBody: { values },
        });

        return product;
      } catch (error) {
        console.error('Error creating product:', error);
        throw error;
      }
    },

    deleteProduct: async (id: string): Promise<void> => {
      try {
        const auth = await getAuthClient();
        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId: SPREADSHEET_ID,
        });

        const sheetId = spreadsheet.data.sheets?.[0].properties?.sheetId;

        if (!sheetId) {
          throw new Error('No se pudo encontrar el ID de la hoja');
        }

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: PRODUCT_RANGE
        });

        const rows = response.data.values || [];
        const rowIndex = parseInt(id);
        
        if (rowIndex < 2 || rowIndex > rows.length + 1) {
          throw new Error(`Fila inválida: ${rowIndex}`);
        }

        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex
                }
              }
            }]
          }
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        const updatedResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'A:A',
        });

        const updatedRows = updatedResponse.data.values;
        if (updatedRows && updatedRows.length > 1) {
          const updates = updatedRows.slice(1).map((_, index) => (index + 1).toString());
          
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'A2:A' + (updates.length + 1),
            valueInputOption: 'RAW',
            requestBody: {
              values: updates.map(id => [id]),
            },
          });
        }
      } catch (error) {
        console.error('Error en deleteProduct:', error);
        throw error;
      }
    },

    getCategories: async (): Promise<Category[]> => {
      const auth = await getAuthClient();
      const { google } = await import('googleapis');
      const sheets = google.sheets({ version: 'v4', auth });

      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: CATEGORY_RANGE,
        });

        const rows = response.data.values || [];
        return rows.map((row) => ({
          id: row[0],
          name: row[1],
        }));
      } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
    },

    createCategory: async (name: string): Promise<Category> => {
      const auth = await getAuthClient();
      const { google } = await import('googleapis');
      const sheets = google.sheets({ version: 'v4', auth });

      try {
        // Primero obtener todas las categorías existentes
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: CATEGORY_RANGE,
        });

        const rows = response.data.values || [];
        
        // Encontrar el ID más alto y sumar 1
        const maxId = rows.reduce((max, row) => {
          const currentId = parseInt(row[0] || '0');
          return currentId > max ? currentId : max;
        }, 0);
        
        const newId = (maxId + 1).toString();
        console.log('Nuevo ID generado:', newId); // Debug

        // Crear los valores para la nueva fila
        const values = [[newId, name.trim()]];
        console.log('Valores a insertar:', values); // Debug

        // Insertar la nueva categoría
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: CATEGORY_RANGE,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: {
            values: values
          }
        });

        // Verificar que se agregó correctamente
        const verifyResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: CATEGORY_RANGE,
        });

        const newRows = verifyResponse.data.values || [];
        const newRow = newRows.find(row => row[0] === newId);

        if (!newRow) {
          throw new Error('Error verificando la nueva categoría');
        }

        return {
          id: newId,
          name: name.trim()
        };
      } catch (error) {
        console.error('Error creating category:', error);
        throw error;
      }
    },

    deleteCategory: async (id: string): Promise<void> => {
      const auth = await getAuthClient();
      const { google } = await import('googleapis');
      const sheets = google.sheets({ version: 'v4', auth });

      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });

      const categoriesSheet = spreadsheet.data.sheets?.find(
        sheet => sheet.properties?.title === 'Categories'
      );
      
      if (!categoriesSheet?.properties?.sheetId) {
        throw new Error('No se pudo encontrar la hoja de categorías');
      }

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: CATEGORY_RANGE
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);

      if (rowIndex === -1) {
        throw new Error('Categoría no encontrada');
      }

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: categoriesSheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2
              }
            }
          }]
        }
      });

      const remainingCategories = rows.filter((_, index) => index !== rowIndex);
      const updates = remainingCategories.map((_, index) => [(index + 1).toString()]);

      if (updates.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `Categories!A2:A${updates.length + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: updates
          }
        });
      }
    },

    updateCategory: async (id: string, name: string): Promise<Category> => {
      const auth = await getAuthClient();
      const { google } = await import('googleapis');
      const sheets = google.sheets({ version: 'v4', auth });

      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `Categories!B${parseInt(id) + 1}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[name]]
          }
        });

        return { id, name };
      } catch (error) {
        console.error('Error updating category:', error);
        throw error;
      }
    },

    getProductCount: async (): Promise<number> => {
      const products = await googleSheetsApi.getProducts();
      return products.length;
    },

    updateProductVisibility: async (id: string, isVisible: boolean) => {
      const { google } = await import('googleapis');
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
      
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: PRODUCT_RANGE,
        });

        const rows = response.data.values;
        if (!rows) throw new Error('No se encontraron productos');

        const rowIndex = rows.findIndex(row => row[0] === id);
        if (rowIndex === -1) throw new Error('Producto no encontrado');

        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `La Libre Web - Catálogo online rev 2021 - products!I${rowIndex + 2}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[isVisible ? 'TRUE' : 'FALSE']]
          }
        });

        return { success: true };
      } catch (error) {
        console.error('Error updating product visibility:', error);
        throw error;
      }
    },
  };
} else {
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
      if (!response.ok) throw new Error('Error al actualizar producto');
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
      const response = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
    },
    getCategories: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    createCategory: async (category: { name: string }) => {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    deleteCategory: async (id: string) => {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
    },
    updateCategory: async (id: string, name: string) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    getProductCount: async () => {
      const products = await googleSheetsApi.getProducts();
      return products.length;
    },
    updateProductVisibility: async (id: string, isVisible: boolean) => {
      const response = await fetch(`/api/products/${id}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible }),
      });
      if (!response.ok) throw new Error('Failed to update product visibility');
      return response.json();
    },
  };
}

export const {
  getProducts,
  updateProduct,
  createProduct,
  deleteProduct,
  getProductCount,
  getCategories,
  createCategory,
  deleteCategory,
  updateCategory,
  updateProductVisibility,
} = googleSheetsApi;
