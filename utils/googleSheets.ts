import { google } from 'googleapis';
import { Product } from '../product/types';
import { getAuthClient } from './auth';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID as string;
const PRODUCT_RANGE = 'La Libre Web - Catálogo online rev 2021 - products!A2:K';
const CATEGORY_RANGE = 'La Libre Web - Catálogo online rev 2021 - categories!A2:C';

type Category = {
  id: string;
  name: string;
  order: string;
};

type GoogleSheetsApi = {
  // Productos
  getProducts: () => Promise<Product[]>;
  getProductById: (productId: string) => Promise<Product | null>;
  createProduct: (product: Product) => Promise<string>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateProductOrder: (productId: string, order: string) => Promise<void>;
  updateProductVisibility: (productId: string, isVisible: boolean) => Promise<void>;
  
  // Categorías
  getCategories: () => Promise<Category[]>;
  createCategory: (category: Category) => Promise<string>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
};

export const googleSheetsApi: GoogleSheetsApi = {
  getProducts: async () => {
    try {
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: PRODUCT_RANGE
      });

      const rows = response.data.values || [];
      return rows.map((row: any[]) => ({
        id: row[0],
        title: row[1],
        description: row[2],
        images: (row[3] || '').split('|||').filter(Boolean),
        price: Number(row[4]) || 0,
        scheduledPublishDate: row[5] ? new Date(row[5].replace(' ', 'T')) : null,
        isScheduled: row[6] === 'TRUE',
        categoryId: row[7] || '',
        isVisible: row[8] ? row[8].toUpperCase() === 'TRUE' : true,
        order: row[9] || '',
        stock: row[10] ? parseInt(row[10], 10) : 0,
        currency: 'ARS'
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  getProductById: async (productId: string) => {
    try {
      const products = await googleSheetsApi.getProducts();
      return products.find(p => p.id === productId) || null;
    } catch (error) {
      console.error('Error getting product by ID:', error);
      throw error;
    }
  },

  createProduct: async (product: Product): Promise<string> => {
    try {
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
      
      const values = [[
        product.id,
        product.title,
        product.description,
        product.images.join('|||'),
        product.price.toString(),
        product.scheduledPublishDate?.toISOString() || '',
        product.isScheduled ? 'TRUE' : 'FALSE',
        product.categoryId || '',
        product.isVisible ? 'TRUE' : 'FALSE',
        product.order || '',
        (product.stock ?? 0).toString()
      ]];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: PRODUCT_RANGE,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });

      return product.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  updateProduct: async (product: Product) => {
    // ... código existente ...
  },

  deleteProduct: async (productId: string) => {
    // ... código existente ...
  },

  updateProductOrder: async (productId: string, order: string) => {
    try {
      const product = await googleSheetsApi.getProductById(productId);
      if (!product) throw new Error('Product not found');

      await googleSheetsApi.updateProduct({
        ...product,
        order
      });
    } catch (error) {
      console.error('Error updating product order:', error);
      throw error;
    }
  },

  updateProductVisibility: async (productId: string, isVisible: boolean) => {
    try {
      const product = await googleSheetsApi.getProductById(productId);
      if (!product) throw new Error('Product not found');

      await googleSheetsApi.updateProduct({
        ...product,
        isVisible
      });
    } catch (error) {
      console.error('Error updating product visibility:', error);
      throw error;
    }
  },

  getCategories: async () => {
    try {
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: CATEGORY_RANGE
      });

      const rows = response.data.values || [];
      return rows.map((row: any[]) => ({
        id: row[0],
        name: row[1],
        order: row[2] || ''
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  createCategory: async (category: Category): Promise<string> => {
    try {
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: CATEGORY_RANGE,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[category.id, category.name, category.order]]
        }
      });

      return category.id;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  updateCategory: async (category: Category) => {
    try {
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: CATEGORY_RANGE
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === category.id);

      if (rowIndex === -1) throw new Error('Category not found');

      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `La Libre Web - Catálogo online rev 2021 - categories!A${rowIndex + 2}:C${rowIndex + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[category.id, category.name, category.order]]
        }
      });
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  deleteCategory: async (categoryId: string) => {
    try {
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: CATEGORY_RANGE
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === categoryId);

      if (rowIndex === -1) throw new Error('Category not found');

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 1, // Asegúrate de que este sea el ID correcto para la hoja de categorías
                dimension: 'ROWS',
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2
              }
            }
          }]
        }
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
};

// Exportamos los métodos individuales
export const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductOrder,
  updateProductVisibility,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = googleSheetsApi;