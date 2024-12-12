import { google } from 'googleapis';
import { Product } from '../product/types';
import { getAuthClient } from './auth';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID as string;
const PRODUCT_RANGE = 'La Libre Web - Catálogo online rev 2021 - products!A2:K';

type GoogleSheetsApi = {
  getProducts: () => Promise<Product[]>;
  getProductById: (productId: string) => Promise<Product | null>;
  createProduct: (product: Product) => Promise<string>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateProductOrder: (productId: string, order: string) => Promise<void>;
};

// Implementación de la API
const api: GoogleSheetsApi = {
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
      const products = await api.getProducts();
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
      const product = await api.getProductById(productId);
      if (!product) throw new Error('Product not found');

      await api.updateProduct({
        ...product,
        order
      });
    } catch (error) {
      console.error('Error updating product order:', error);
      throw error;
    }
  }
};

// Exportamos la API completa
export const googleSheetsApi = api;

// Exportamos los métodos individuales
export const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductOrder
} = api;