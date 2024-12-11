import { mutate } from 'swr';
import { Category, Product } from '../product/types';

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
  const PRODUCT_RANGE = 'La Libre Web - Catálogo online rev 2021 - products!A2:K';
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

        return rows
          .map((row: any[]) => ({
            id: row[0],
            title: row[1],
            description: row[2],
            images: (row[3] || '').split('|||').filter(Boolean),
            price: parseFloat(row[4]),
            scheduledPublishDate: row[5] ? new Date(row[5].replace(' ', 'T')) : null,
            isScheduled: row[6] === 'TRUE',
            categoryId: row[7] || '',
            isVisible: row[8] ? row[8].toUpperCase() === 'TRUE' : true,
            order: row[9] || '',
            stock: row[10] ? parseInt(row[10], 10) : 0,
            currency: 'ARS'
          }))
          .filter((product) => product.title && product.title.trim() !== '');
      } catch (error) {
        console.error('Error fetching products from Google Sheets:', error);
        throw error;
      }
    },

    updateProduct: async (product: Product): Promise<void> => {
      try {
        const auth = await getAuthClient();
        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los productos para encontrar el índice correcto
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: PRODUCT_RANGE,
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === product.id);

        if (rowIndex === -1) {
          throw new Error('Producto no encontrado');
        }

        // Calcular la fila real (añadimos 2 porque empezamos desde A2)
        const actualRow = rowIndex + 2;

        // Mantener el orden secuencial en la columna J
        const values = [[
          product.id,                // Columna A
          product.title,            // Columna B
          product.description,      // Columna C
          product.images ? (Array.isArray(product.images) ? product.images.join('|||') : product.images) : '', // Columna D
          product.price.toString(), // Columna E
          product.scheduledPublishDate ? formatLocalDateTime(product.scheduledPublishDate) : '', // Columna F
          product.isScheduled ? 'TRUE' : 'FALSE', // Columna G
          product.categoryId || '', // Columna H
          product.isVisible ? 'TRUE' : 'FALSE', // Columna I
          product.order || '',     // Columna J
          (product.stock ?? 0).toString() // Columna K
        ]];

        // Actualizar la fila
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `La Libre Web - Catálogo online rev 2021 - products!A${actualRow}:K${actualRow}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values }
        });

        // Verificar la actualización
        const verifyResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `La Libre Web - Catálogo online rev 2021 - products!A${actualRow}:K${actualRow}`
        });

        if (!verifyResponse.data.values?.[0]) {
          throw new Error('Error al verificar la actualización');
        }

        // Verificamos específicamente el stock
        const updatedStock = parseInt(verifyResponse.data.values[0][10] || '0', 10);
        if (updatedStock !== product.stock) {
          console.warn('Stock verification mismatch:', {
            expected: product.stock,
            received: updatedStock
          });
        }
      } catch (error) {
        console.error('Error updating product in Google Sheets:', error);
        throw error;
      }
    },

    createProduct: async (product: Product): Promise<string> => {
      try {
        const auth = await getAuthClient();
        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        const currentProducts = await googleSheetsApi.getProducts();
        const newId = (Math.max(...currentProducts.map((p: Product) => parseInt(p.id)), 0) + 1).toString();

        const values = [[
          newId,                   // Columna A
          product.title,           // Columna B
          product.description,     // Columna C
          product.images ? (Array.isArray(product.images) ? product.images.join('|||') : product.images) : '', // Columna D
          product.price.toString(), // Columna E
          product.scheduledPublishDate ? formatLocalDateTime(product.scheduledPublishDate) : '', // Columna F
          product.isScheduled ? 'TRUE' : 'FALSE', // Columna G
          product.categoryId || '', // Columna H
          product.isVisible ? 'TRUE' : 'FALSE', // Columna I
          product.order || '',     // Columna J
          product.stock ?? 0       // Columna K
        ]];

        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: PRODUCT_RANGE,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values },
        });

        return newId;
      } catch (error) {
        console.error('Error in createProduct:', error);
        throw error;
      }
    },

    deleteProduct: async (productId: string): Promise<void> => {
      try {
        const auth = await getAuthClient();
        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        // Primero obtenemos todas las filas para encontrar el índice correcto
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'La Libre Web - Catálogo online rev 2021 - products!A2:K'
        });

        const rows = response.data.values || [];
        // Encontramos el índice exacto del producto a eliminar
        const rowIndex = rows.findIndex(row => row[0] === productId);

        if (rowIndex === -1) {
          throw new Error(`Producto con ID ${productId} no encontrado`);
        }

        // El índice real en el sheet es rowIndex + 2 (por el encabezado y porque los índices empiezan en 0)
        const actualRow = rowIndex + 2;

        // Eliminamos la fila específica
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: 0, // Asegúrate de que este sea el ID correcto de tu hoja
                  dimension: 'ROWS',
                  startIndex: actualRow - 1, // -1 porque la API usa índices base 0
                  endIndex: actualRow // No necesita -1 porque endIndex es exclusivo
                }
              }
            }]
          }
        });

        // Verificamos que se haya eliminado correctamente
        const verifyResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `La Libre Web - Catálogo online rev 2021 - products!A${actualRow}:A${actualRow}`
        });

        if (verifyResponse.data.values?.[0]?.[0] === productId) {
          throw new Error('La fila no se eliminó correctamente');
        }

      } catch (error) {
        console.error('Error deleting product:', error);
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

    updateProductVisibility: async (productId: string, isVisible: boolean): Promise<void> => {
      const auth = await getAuthClient();
      const { google } = await import('googleapis');
      const sheets = google.sheets({ version: 'v4', auth });

      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'La Libre Web - Catálogo online rev 2021 - products!A2:I',
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === productId);

        if (rowIndex === -1) {
          throw new Error('Producto no encontrado');
        }

        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `La Libre Web - Catálogo online rev 2021 - products!I${rowIndex + 2}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[isVisible.toString().toUpperCase()]]
          }
        });
      } catch (error) {
        console.error('Error updating product visibility:', error);
        throw error;
      }
    },

    updateProductOrder: async (orderedIds: string[]): Promise<void> => {
      const auth = await getAuthClient();
      const { google } = await import('googleapis');
      const sheets = google.sheets({ version: 'v4', auth });

      try {
        // Primero obtenemos todas las filas actuales
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'La Libre Web - Catálogo online rev 2021 - products!A2:K', // Incluimos columna A para referencia
        });

        const currentRows = response.data.values || [];
        
        // Creamos un mapa con los datos actuales, excluyendo la columna A (ID)
        const rowMap = new Map(
          currentRows.map(row => [row[0], row.slice(1)]) // row[0] es el ID, slice(1) toma el resto
        );

        // Creamos las nuevas filas en el orden deseado, pero solo desde la columna B
        const newRows = orderedIds
          .map(id => rowMap.get(id))
          .filter((row): row is any[] => row !== undefined);

        if (newRows.length > 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'La Libre Web - Catálogo online rev 2021 - products!B2:K',
            valueInputOption: 'RAW',
            requestBody: { values: newRows }
          });
        }
      } catch (error) {
        console.error('Error updating product order:', error);
        throw error;
      }
    }
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
    updateProductVisibility: async (productId: string, isVisible: boolean) => {
      const response = await fetch(`/api/products/${productId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible }),
      });
      if (!response.ok) throw new Error('Failed to update product visibility');
    },
    updateProductOrder: async (orderedIds: string[]) => {
      const response = await fetch('/api/products/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds }),
      });
      if (!response.ok) throw new Error('Failed to update product order');
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
  updateProductOrder,
} = googleSheetsApi;