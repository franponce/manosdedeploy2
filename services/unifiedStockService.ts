import { doc, getDoc, updateDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../utils/firebase';

export interface StockData {
  available: number;
  reserved: number;
  reservations: Record<string, number>;
}

export const unifiedStockService = {
  // Obtener stock actual
  getStock: async (productId: string): Promise<StockData> => {
    const docRef = doc(db, 'stock', productId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() 
      ? docSnap.data() as StockData 
      : { available: 0, reserved: 0, reservations: {} };
  },

  // Suscribirse a cambios en tiempo real
  subscribeToStock: (productId: string, callback: (stock: StockData) => void) => {
    return onSnapshot(doc(db, 'stock', productId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        callback(docSnapshot.data() as StockData);
      } else {
        callback({ available: 0, reserved: 0, reservations: {} });
      }
    });
  },

  // Actualizar stock
  updateStock: async (productId: string, newStock: number): Promise<void> => {
    const docRef = doc(db, 'stock', productId);
    await runTransaction(db, async (transaction) => {
      const stockDoc = await transaction.get(docRef);
      if (!stockDoc.exists()) {
        transaction.set(docRef, {
          available: newStock,
          reserved: 0,
          reservations: {}
        });
      } else {
        transaction.update(docRef, {
          available: newStock
        });
      }
    });
  },

  // Reservar stock
  reserveStock: async (productId: string, quantity: number, reservationId: string): Promise<boolean> => {
    const docRef = doc(db, 'stock', productId);
    try {
      await runTransaction(db, async (transaction) => {
        const stockDoc = await transaction.get(docRef);
        const stockData = stockDoc.exists() ? stockDoc.data() as StockData : { available: 0, reserved: 0, reservations: {} };
        
        if (stockData.available - stockData.reserved < quantity) {
          throw new Error('No hay suficiente stock disponible');
        }

        transaction.update(docRef, {
          reserved: (stockData.reserved || 0) + quantity,
          reservations: {
            ...stockData.reservations,
            [reservationId]: quantity
          }
        });
      });
      return true;
    } catch (error) {
      console.error('Error reservando stock:', error);
      return false;
    }
  }
}; 