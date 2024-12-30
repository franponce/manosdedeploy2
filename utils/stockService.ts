import { getProducts, updateProduct } from './googleSheets';
import { Product } from '../product/types';

export const stockService = {
  async updateStock(productId: string, newStock: number): Promise<void> {
    try {
      // Actualizar solo en Google Sheets
      const products = await getProducts();
      const product = products.find((p: Product) => p.id === productId);
      
      if (product) {
        await updateProduct({
          ...product,
          stock: newStock
        });
      } else {
        throw new Error('Producto no encontrado');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  async getAvailableStock(productId: string): Promise<number> {
    try {
      // Obtener stock directamente de Sheets
      const products = await getProducts();
      const product = products.find((p: Product) => p.id === productId);
      return product?.stock || 0;
    } catch (error) {
      console.error('Error getting stock:', error);
      return 0;
    }
  }
}; 