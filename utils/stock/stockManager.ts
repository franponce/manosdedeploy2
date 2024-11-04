import { kv } from '@vercel/kv';
import { getProducts, updateProduct } from '../googleSheets';
import { Product } from '@/product/types';

export class StockManager {
  static STOCK_PREFIX: any;
  static CACHE_TTL: number | undefined;
  static async getCurrentStock(productId: string): Promise<number> {
    try {
      const cachedStock = await kv.get<number>(`${this.STOCK_PREFIX}${productId}`);
      
      if (cachedStock !== null) {
        return Math.max(0, cachedStock);
      }

      const products = await getProducts();
      const product = products.find((p: Product) => p.id === productId);
      const stock = product ? Number(product.stock) : 0;
      
      if (this.CACHE_TTL) {
        await kv.set(`${this.STOCK_PREFIX}${productId}`, stock, { ex: this.CACHE_TTL });
      } else {
        await kv.set(`${this.STOCK_PREFIX}${productId}`, stock);
      }
      
      return Math.max(0, stock);
    } catch (error) {
      console.error('Error al obtener stock:', error);
      return 0;
    }
  }

  static async validateStockIncrement(productId: string, currentQuantity: number): Promise<boolean> {
    try {
      const currentStock = await this.getCurrentStock(productId);
      return currentQuantity < currentStock;
    } catch (error) {
      console.error('Error validando stock increment:', error);
      return false; // Por defecto, no permitir incremento si hay error
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