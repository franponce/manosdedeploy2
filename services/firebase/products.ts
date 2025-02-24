import { db } from './config';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Product } from '../../product/types';

const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';

export const productService = {
  async getAll(): Promise<Product[]> {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
  },

  async create(product: Omit<Product, 'id'>): Promise<Product> {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { ...product, id: docRef.id };
  },

  async update(id: string, product: Partial<Product>): Promise<void> {
    await updateDoc(doc(db, PRODUCTS_COLLECTION, id), {
      ...product,
      updatedAt: new Date()
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
  },

  async updateStock(id: string, stock: number): Promise<void> {
    await updateDoc(doc(db, PRODUCTS_COLLECTION, id), {
      stock,
      updatedAt: new Date()
    });
  }
}; 