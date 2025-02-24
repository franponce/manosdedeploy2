import { db } from './config';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const CATEGORIES_COLLECTION = 'categories';

export interface Category {
  id: string;
  name: string;
}

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const querySnapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Category));
  },

  async create(name: string): Promise<Category> {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      name,
      createdAt: new Date()
    });
    return { id: docRef.id, name };
  },

  async update(id: string, name: string): Promise<void> {
    await updateDoc(doc(db, CATEGORIES_COLLECTION, id), {
      name,
      updatedAt: new Date()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
  }
}; 