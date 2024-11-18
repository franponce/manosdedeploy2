import { storage } from '@/utils/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const imageService = {
  async upload(file: File, productId: string): Promise<string> {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `products/${productId}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    
    return url;
  },

  async delete(url: string): Promise<void> {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  },

  getImagePath(url: string): string {
    // Extraer path de la URL de Firebase
    const decodedUrl = decodeURIComponent(url);
    return decodedUrl.split('products%2F')[1].split('?')[0];
  }
}; 