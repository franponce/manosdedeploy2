import { Category, Product } from '../product/types';
// Eliminamos la importación de Category ya que no existe el módulo

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
  // Esto solo se ejecutará en el servidor
  const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
  const PRODUCT_RANGE = 'La Libre Web - Catálogo online rev 2021 - products!A2:H';
  const CATEGORY_RANGE = 'Categories!A2:B'; // Nuevo rango para las categorías
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

  googleSheetsApi = {
    getProducts: async (): Promise<Product[]> => {
      try {
        console.log('Starting getProducts in googleSheets.ts');
        
        const auth = await getAuthClient();
        console.log('GoogleAuth instance created');

        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: PRODUCT_RANGE,
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
            currency: 'USD', 
            image: row[3],
            price: parseFloat(row[4]) || 0,
            scheduledPublishDate: row[5] ? new Date(row[5].replace(' ', 'T')) : null,
            isScheduled: row[6] === 'TRUE',
            categoryId: row[7] || '', // Añadimos el categoryId
          }))
          .filter((product) => product.title && product.title.trim() !== '');
      } catch (error) {
        console.error('Error fetching products from Google Sheets:', error);
        throw error;
      }
    },

    updateProduct: async (product: Product): Promise<void> => {
      try {
        console.log('Updating product:', product);
        const auth = await getAuthClient();
        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        const values = [
          [
            product.id, 
            product.title, 
            product.description, 
            product.image, 
            product.price.toString(),
            product.scheduledPublishDate ? formatLocalDateTime(product.scheduledPublishDate) : '',
            product.isScheduled ? 'TRUE' : 'FALSE',
            product.categoryId 
          ],
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `La Libre Web - Catálogo online rev 2021 - products!A${parseInt(product.id) + 1}:H${parseInt(product.id) + 1}`,
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
        // Validar tamaño de imagen
        if (product.image && product.image.length > 50000) {
          throw new Error('La imagen es demasiado grande. Por favor, reduce su tamaño.');
        }

        const currentProducts = await googleSheetsApi.getProducts();
        const newId = (Math.max(...currentProducts.map(p => parseInt(p.id)), 0) + 1).toString();

        // Formatear fecha correctamente
        const scheduledDate = product.scheduledPublishDate 
          ? formatLocalDateTime(new Date(product.scheduledPublishDate))
          : '';

        const values = [
          [
            newId,
            product.title,
            product.description,
            product.image,
            product.price.toString(),
            scheduledDate,
            product.isScheduled ? 'TRUE' : 'FALSE',
            product.categoryId || ''
          ]
        ];

        console.log('Prepared values for sheet:', values);

        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: PRODUCT_RANGE,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values },
        });

        console.log('Product created successfully');
        return newId;
      } catch (error) {
        console.error('Error in createProduct:', error);
        throw error;
      }
    },

    deleteProduct: async (id: string): Promise<void> => {
      try {
        const auth = await getAuthClient();
        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Obtener información de la hoja de cálculo
        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId: SPREADSHEET_ID,
        });

        // 2. Encontrar el sheetId correcto
        const sheet = spreadsheet.data.sheets?.find(
          s => s.properties?.title === 'La Libre Web - Catálogo online rev 2021 - products'
        );

        if (!sheet || !sheet.properties?.sheetId) {
          throw new Error('No se pudo encontrar la hoja de productos');
        }

        const sheetId = sheet.properties.sheetId;
        const rowIndex = parseInt(id) + 1;

        // 3. Eliminar la fila
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1
                }
              }
            }]
          }
        });

        // 4. Obtener productos restantes y actualizar IDs
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: PRODUCT_RANGE,
        });

        const rows = response.data.values || [];

        // 5. Actualizar los IDs
        const updates = rows.map((row, index) => {
          const newId = (index + 1).toString();
          return [
            newId,
            ...row.slice(1)
          ];
        });

        // 6. Actualizar la hoja con los nuevos IDs
        if (updates.length > 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: PRODUCT_RANGE,
            valueInputOption: 'RAW',
            requestBody: {
              values: updates
            }
          });
        }

        console.log('Producto eliminado y referencias actualizadas exitosamente');
      } catch (error) {
        console.error('Error al eliminar producto de Google Sheets:', error);
        throw error;
      }
    },

    getProductCount: async (): Promise<number> => {
      const products = await googleSheetsApi.getProducts();
      return products.length;
    },

    getCategories: async (): Promise<Category[]> => {
      const auth = await getAuthClient();
      const { google } = await import('googleapis');
      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Categories!A1:B', // Cambiamos esto para incluir desde A1
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        return [];
      }

      return rows.map((row: any[]) => ({
        id: row[0],
        name: row[1],
      }));
    },

    createCategory: async (category: { name: string }): Promise<Category> => {
      const auth = await getAuthClient();
      const { google } = await import('googleapis');
      const sheets = google.sheets({ version: 'v4', auth });

      const categories = await googleSheetsApi.getCategories();
      const newId = (Math.max(...categories.map((c: { id: string; }) => parseInt(c.id)), 0) + 1).toString();

      const values = [[newId, category.name]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Categories!A1:B', // Cambiamos esto para empezar desde A1
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values },
      });

      return { id: newId, name: category.name };
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
      if (!response.ok) throw new Error('Error al actualizar producto. Revisa las medidas y peso de la imagen que querés cargar');
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
} = googleSheetsApi;
