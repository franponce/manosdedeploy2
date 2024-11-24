import { db } from '../utils/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

export async function fixStockNumbers() {
  const stockRef = collection(db, 'stock');
  const snapshot = await getDocs(stockRef);
  const batch = writeBatch(db);
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    batch.update(doc.ref, {
      quantity: Number(data.quantity) || 0,
      available: Number(data.quantity) || 0,
      reserved: Number(data.reserved) || 0,
      reservations: data.reservations || {}
    });
  });

  await batch.commit();
  console.log('Stock numbers fixed');
} 