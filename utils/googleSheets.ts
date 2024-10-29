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

  const compressImage = (base64Image: string): string => {
    // Si la imagen ya es menor que el límite, retornarla sin cambios
    if (base64Image.length <= 50000) return base64Image;

    // Extraer el tipo de imagen y los datos
    const [header, data] = base64Image.split(',');
    const quality = 0.7; // Ajustar este valor según necesidad

    // Crear una imagen temporal
    const img = new Image();
    img.src = base64Image;

    // Crear un canvas para la compresión
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Establecer dimensiones máximas
    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 600;
    
    let width = img.width;
    let height = img.height;

    // Calcular nuevas dimensiones manteniendo la proporción
    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
    }

    canvas.width = width;
    canvas.height = height;
    
    // Dibujar la imagen redimensionada
    ctx?.drawImage(img, 0, 0, width, height);
    
    // Retornar la imagen comprimida
    return canvas.toDataURL('image/jpeg', quality);
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
        let imageToSave = product.image;

        // Comprimir imagen si es necesario
        if (imageToSave && imageToSave.length > 50000) {
          try {
            imageToSave = await compressImage(imageToSave);
            
            // Si aún después de comprimir es muy grande
            if (imageToSave.length > 50000) {
              throw new Error('La imagen sigue siendo demasiado grande después de la compresión. Por favor, usa una imagen más pequeña.');
            }
          } catch (error) {
            console.error('Error comprimiendo imagen:', error);
            throw new Error('Error comprimiendo imagen. Por favor, intenta nuevamente.');
          }
        }

        const auth = await getAuthClient();
        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        const currentProducts = await googleSheetsApi.getProducts();
        const newId = (Math.max(...currentProducts.map((p: Product) => parseInt(p.id)), 0) + 1).toString();

        // Formatear fecha correctamente
        const scheduledDate = product.scheduledPublishDate 
          ? formatLocalDateTime(new Date(product.scheduledPublishDate))
          : '';

        const values = [
          [
            newId,
            product.title,
            product.description,
            imageToSave,
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

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: PRODUCT_RANGE
        });

        const rows = response.data.values || [];
        // El id representa la fila en el sheet (2 para A2, 3 para A3, etc.)
        const rowIndex = parseInt(id);
        
        // Validar que el índice está dentro del rango válido (A2 en adelante)
        if (rowIndex < 2 || rowIndex > rows.length + 1) {
          throw new Error(`Fila inválida: ${rowIndex}`);
        }

        // Ajustar el índice para el array (0-based)
        const adjustedIndex = rowIndex - 2;
        console.log(`Eliminando producto en índice ${adjustedIndex} (fila ${rowIndex})`);
        
        // Eliminar la fila usando el método batchUpdate
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: 0, // ID de la hoja, 0 para la primera hoja
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1, // -1 porque las filas son 0-based
                  endIndex: rowIndex // No incluye este índice
                }
              }
            }]
          }
        });

        // Esperar a que se complete la sincronización
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error en deleteProduct:', error);
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
      const response = await fetch(`/api/products?id=${id}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete product');
      }
      return response.json();
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
