import { db } from '../utils/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

export async function migrateStockDocuments() {
  const stockRef = collection(db, 'stock');
  const snapshot = await getDocs(stockRef);
  const batch = writeBatch(db);
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    batch.update(doc.ref, {
      available: data.quantity || 0,
      reserved: 0,
      reservations: {},
      // mantener quantity existente
      quantity: data.quantity || 0
    });
  });

  await batch.commit();
  console.log('Stock migration completed');
} 