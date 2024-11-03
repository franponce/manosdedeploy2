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
  const SHEET_NAME = 'La Libre Web - Catálogo online rev 2021 - products';
  const PRODUCT_RANGE = `${SHEET_NAME}!A2:I`;
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

  const checkAndUpdateScheduledProducts = async () => {
    try {
      const auth = await getAuthClient();
      const { google } = await import('googleapis');
      const sheets = google.sheets({ version: 'v4', auth });

      // Obtener todos los productos
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: PRODUCT_RANGE,
      });

      const rows = response.data.values;
      if (!rows) return;

      const now = new Date();
      const updates: {
        range: string; values: string[][]; // Limpiar fecha y establecer isScheduled a FALSE
      }[] = [];

      rows.forEach((row, index) => {
        if (row[6] === 'TRUE' && row[5]) { // isScheduled y scheduledPublishDate
          const scheduledDate = new Date(row[5].replace(' ', 'T'));
          if (scheduledDate <= now) {
            // El producto debe ser actualizado
            updates.push({
              range: `La Libre Web - Catálogo online rev 2021 - products!F${index + 2}:G${index + 2}`,
              values: [['', 'FALSE']] // Limpiar fecha y establecer isScheduled a FALSE
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
        console.log('Starting getProducts in googleSheets.ts');
        
        // Verificar productos programados antes de obtenerlos
        await checkAndUpdateScheduledProducts();

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
            categoryId: row[7] || '',
            stock: parseInt(row[8]) || 0, // Aseguramos que stock sea número
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

        // Primero obtenemos todos los productos para encontrar la fila correcta
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'La Libre Web - Catálogo online rev 2021 - products',
        });
        const rows = response.data.values;
        if (!rows || rows.length === 0) {
          throw new Error('No se encontraron productos');
        }
        
        const rowIndex = rows.findIndex(row => row[0] === product.id);

        if (rowIndex === -1) {
          throw new Error('Producto no encontrado');
        }

        const values = [
          [
            product.id,
            product.title,
            product.description,
            product.image,
            product.price.toString(),
            product.scheduledPublishDate ? formatLocalDateTime(product.scheduledPublishDate) : '',
            product.isScheduled ? 'TRUE' : 'FALSE',
            product.categoryId,
            product.stock.toString()
          ],
        ];

        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `La Libre Web - Catálogo online rev 2021 - products!A${rowIndex + 1}:I${rowIndex + 1}`,
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
        console.log('Descripción recibida:', product.description);
        
        const currentProducts = await googleSheetsApi.getProducts();
        if (currentProducts.length >= PRODUCT_LIMIT) {
          throw new Error(`Product limit of ${PRODUCT_LIMIT} reached. Unable to add more products.`);
        }

        let imageToSave = product.image;
        if (imageToSave && imageToSave.length > 50000) {
          try {
            imageToSave = await compressImage(imageToSave);
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

        const newId = (Math.max(...currentProducts.map((p: Product) => parseInt(p.id)), 0) + 1).toString();
        
        const description = product.description || '';
        console.log('Descripción procesada:', description);
        
        const values = [
          [
            newId, 
            product.title, 
            description,
            imageToSave,
            product.price.toString(),
            product.scheduledPublishDate ? new Date(product.scheduledPublishDate).toISOString() : '',
            product.isScheduled ? 'TRUE' : 'FALSE',
            product.categoryId || '',
            (product.stock || 0).toString()
          ],
        ];

        console.log('Valores a insertar en sheets:', JSON.stringify(values, null, 2));

        const response = await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: PRODUCT_RANGE,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values },
        });

        console.log('Respuesta de Google Sheets:', response.data);
        console.log('Producto creado exitosamente con ID:', newId);
        return newId;
      } catch (error) {
        console.error('Error detallado en createProduct:', error);
        throw error;
      }
    },

    deleteProduct: async (id: string): Promise<void> => {
      try {
        const auth = await getAuthClient();
        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        // Primero, obtener la información de la hoja
        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId: SPREADSHEET_ID,
        });

        // Obtener el sheetId de la primera hoja (o la hoja específica que uses)
        const sheetId = spreadsheet.data.sheets?.[0].properties?.sheetId;

        if (!sheetId) {
          throw new Error('No se pudo encontrar el ID de la hoja');
        }

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
        
        // Eliminar la fila usando el método batchUpdate con el sheetId correcto
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: sheetId,
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

        // Reordenar IDs
        const updatedResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'A:A', // Solo la columna de IDs
        });

        const updatedRows = updatedResponse.data.values;
        if (updatedRows && updatedRows.length > 1) { // Ignorar la fila de encabezados
          const updates = updatedRows.slice(1).map((_, index) => (index + 1).toString());
          
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'A2:A' + (updates.length + 1), // Comenzar desde A2 para ignorar encabezados
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

    getProductCount: async (): Promise<number> => {
      const products = await googleSheetsApi.getProducts();
      return products.length;
    },

    getCategories: async (): Promise<Category[]> => {
      const auth = await getAuthClient();
      const { google } = await import('googleapis');
      const sheets = google.sheets({ version: 'v4', auth });

      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Categories!A2:B', // Cambiado de A1:B a A2:B para omitir los encabezados
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

    createCategory: async (category: { name: string }): Promise<Category> => {
      const auth = await getAuthClient();
      const { google } = await import('googleapis');
      const sheets = google.sheets({ version: 'v4', auth });

      const categories = await googleSheetsApi.getCategories();
      
      if (categories.length >= 8) {
        throw new Error(`No se pueden crear más categorías. El límite es de 8 categorías.`);
      }

      const newId = (Math.max(...categories.map((c: { id: string; }) => parseInt(c.id)), 0) + 1).toString();
      const values = [[newId, category.name]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Categories!A2:B',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values },
      });

      return { id: newId, name: category.name };
    },

    deleteCategory: async (id: string): Promise<void> => {
      console.log('Starting deleteCategory for ID:', id);
      
      try {
        const auth = await getAuthClient();
        const { google } = await import('googleapis');
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener información de la hoja
        console.log('Fetching spreadsheet info');
        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId: SPREADSHEET_ID,
        });

        // Encontrar la hoja de categorías
        const categoriesSheet = spreadsheet.data.sheets?.find(
          sheet => sheet.properties?.title === 'Categories'
        );
        
        if (!categoriesSheet?.properties?.sheetId) {
          console.error('Categories sheet not found');
          throw new Error('No se pudo encontrar la hoja de categorías');
        }

        // Obtener todas las categorías
        console.log('Fetching current categories');
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Categories!A2:B'
        });

        const rows = response.data.values || [];
        console.log('Current categories:', rows);
        
        const rowIndex = rows.findIndex(row => row[0] === id);
        console.log('Found category at index:', rowIndex);

        if (rowIndex === -1) {
          console.error('Category not found:', id);
          throw new Error('Categoría no encontrada');
        }

        // Eliminar la fila
        console.log('Deleting row at index:', rowIndex + 1);
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

        // Reordenar IDs
        console.log('Reordering remaining categories');
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

        console.log('Category deletion completed successfully');
      } catch (error) {
        console.error('Error in deleteCategory:', error);
        throw error;
      }
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
    deleteCategory: async (id: string) => {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete category');
      }
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
} = googleSheetsApi;

// Constantes globales al inicio del archivo
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = 'La Libre Web - Catálogo online rev 2021 - products';
const PRODUCT_RANGE = `${SHEET_NAME}!A2:I`;

export const getProductById = async (id: string): Promise<Product | null> => {
  if (!SPREADSHEET_ID) {
    throw new Error('GOOGLE_SHEET_ID no está configurado');
  }

  try {
    const auth = await getAuthClient();
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: PRODUCT_RANGE,
    });

    if (!response.data.values) {
      return null;
    }

    const product = response.data.values.find(row => row[0].toString() === id.toString());
    
    if (!product) {
      return null;
    }

    return {
      id: product[0].toString(),
      title: product[1],
      description: product[2],
      image: product[3],
      price: parseFloat(product[4]) || 0,
      scheduledPublishDate: product[5] ? new Date(product[5]) : null,
      isScheduled: product[6] === 'TRUE',
      categoryId: product[7] || '',
      stock: parseInt(product[8]) || 0,
      currency: 'ARS'
    };
  } catch (error) {
    console.error('Error obteniendo producto por ID:', error);
    throw error;
  }
};

// Asegurarnos que el stock se incluya en todas las operaciones
const formatProductForSheet = (product: Product): string[] => {
  return [
    product.id,
    product.title || '',
    product.description || '', // Aseguramos que no sea undefined
    product.image || '',
    (product.price || 0).toString(),
    product.scheduledPublishDate ? formatLocalDateTime(new Date(product.scheduledPublishDate)) : '',
    product.isScheduled ? 'TRUE' : 'FALSE',
    product.categoryId || '',
    (product.stock || 0).toString(),
    product.lastStockUpdate || ''
  ];
};

function formatLocalDateTime(scheduledPublishDate: Date): string {
  throw new Error('Function not implemented.');
}

export const updateProductStock = async (productId: string, newStock: number): Promise<void> => {
  if (!SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID no está configurado');
  }

  try {
    const auth = await getAuthClient();
    const { google } = await import('googleapis');
    const sheets = google.sheets({ version: 'v4', auth });

    // Primero verificamos si el producto existe
    const product = await getProductById(productId);
    if (!product) {
      throw new Error(`Producto no encontrado: ${productId}`);
    }

    // Obtenemos todos los productos para encontrar el índice correcto
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: PRODUCT_RANGE,
    });

    if (!response.data.values) {
      throw new Error('No se encontraron datos en la hoja');
    }

    // Buscamos el índice exacto del producto
    const rowIndex = response.data.values.findIndex(row => {
      console.log('Comparando:', row[0], productId); // Debug
      return row[0].toString() === productId.toString();
    });

    if (rowIndex === -1) {
      throw new Error(`No se encontró la fila para el producto: ${productId}`);
    }

    // Actualizamos el stock
    const updateRange = `${SHEET_NAME}!I${rowIndex + 2}`; // +2 porque el rango empieza en A2
    console.log('Actualizando rango:', updateRange); // Debug

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: updateRange,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[newStock.toString()]]
      }
    });

    console.log(`Stock actualizado exitosamente - Producto: ${productId}, Nuevo stock: ${newStock}`);
  } catch (error) {
    console.error('Error detallado actualizando stock:', error);
    throw error;
  }
};

