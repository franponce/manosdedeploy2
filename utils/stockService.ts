import { getProducts, updateProduct } from './googleSheets';
import { Product } from '../product/types';

interface CachedProduct {
  data: Product;
  timestamp: number;
}

class StockServiceSingleton {
  private static instance: StockServiceSingleton;
  private productsCache: Map<string, CachedProduct> = new Map();
  private lastFullUpdate: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private FULL_UPDATE_INTERVAL = 30 * 60 * 1000; // 30 minutos

  private constructor() {}

  static getInstance(): StockServiceSingleton {
    if (!StockServiceSingleton.instance) {
      StockServiceSingleton.instance = new StockServiceSingleton();
    }
    return StockServiceSingleton.instance;
  }

  async getAllProducts(): Promise<Product[]> {
    const now = Date.now();
    if (now - this.lastFullUpdate > this.FULL_UPDATE_INTERVAL) {
      const products = await getProducts();
      products.forEach((product: Product) => {
        this.productsCache.set(product.id, {
          data: product,
          timestamp: now
        });
      });
      this.lastFullUpdate = now;
      return products;
    }

    return Array.from(this.productsCache.values())
      .map(cached => cached.data);
  }

  async getAvailableStock(productId: string): Promise<number> {
    const cached = this.productsCache.get(productId);
    const now = Date.now();

    if (cached && (now - cached.timestamp < this.CACHE_DURATION)) {
      return cached.data.stock || 0;
    }

    try {
      const products = await this.getAllProducts();
      const product = products.find(p => p.id === productId);
      return product?.stock || 0;
    } catch (error) {
      console.error('Error getting stock:', error);
      return cached?.data.stock || 0;
    }
  }

  async updateStock(productId: string, newStock: number): Promise<void> {
    try {
      const cached = this.productsCache.get(productId);
      if (!cached) {
        throw new Error('Producto no encontrado');
      }

      const updatedProduct = {
        ...cached.data,
        stock: newStock
      };

      await updateProduct(updatedProduct);
      
      // Actualizar cache inmediatamente
      this.productsCache.set(productId, {
        data: updatedProduct,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  clearCache() {
    this.productsCache.clear();
    this.lastFullUpdate = 0;
  }
}

export const stockService = StockServiceSingleton.getInstance(); 