import { getProducts, updateProduct } from '../googleSheets';
import { Product } from '@/product/types';

export class StockManager {
  static async getCurrentStock(productId: string): Promise<number> {
    try {
      const products = await getProducts();
      const product = products.find((p: Product) => p.id === productId);
      return product?.stock || 0;
    } catch (error) {
      console.error('Error al obtener stock actual:', error);
      throw new Error('Error al obtener stock actual');
    }
  }

  static async updateStock(productId: string, newStock: number): Promise<void> {
    try {
      const product = await this.getProductWithCurrentStock(productId);
      if (!product) throw new Error('Producto no encontrado');

      await updateProduct({
        ...product,
        stock: newStock,
        lastStockUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      throw new Error('Error al actualizar stock');
    }
  }

  static async validateStock(productId: string, requestedQuantity: number): Promise<boolean> {
    try {
      const currentStock = await this.getCurrentStock(productId);
      return currentStock >= requestedQuantity;
    } catch (error) {
      console.error('Error al validar stock:', error);
      throw new Error('Error al validar stock');
    }
  }

  private static async getProductWithCurrentStock(productId: string): Promise<Product | null> {
    const products = await getProducts();
    return products.find((p: Product) => p.id === productId) || null;
  }
} 