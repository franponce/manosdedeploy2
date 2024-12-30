import { db } from '../utils/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getProducts, updateProduct } from './googleSheets';

export const stockService = {
  async updateStock(productId: string, newStock: number): Promise<void> {
    try {
      // 1. Actualizar en Firebase
      const stockRef = doc(db, 'stocks', productId);
      const stockDoc = await getDoc(stockRef);
      
      if (stockDoc.exists()) {
        await updateDoc(stockRef, { available: newStock });
      } else {
        await setDoc(stockRef, { available: newStock });
      }

      // 2. Actualizar en Google Sheets
      const products = await getProducts();
      const product = products.find((p: { id: string; }) => p.id === productId);
      
      if (product) {
        await updateProduct({
          ...product,
          stock: newStock
        });
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  async getAvailableStock(productId: string): Promise<number> {
    try {
      // 1. Obtener de Firebase
      const stockRef = doc(db, 'stocks', productId);
      const stockDoc = await getDoc(stockRef);
      
      if (!stockDoc.exists()) {
        // 2. Si no existe en Firebase, obtener de Sheets y sincronizar
        const products = await getProducts();
        const product = products.find((p: { id: string; }) => p.id === productId);
        const sheetStock = product?.stock || 0;
        
        // Crear en Firebase
        await setDoc(stockRef, { available: sheetStock });
        return sheetStock;
      }

      return stockDoc.data().available || 0;
    } catch (error) {
      console.error('Error getting stock:', error);
      return 0;
    }
  }
}; 