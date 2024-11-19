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

  async delete(imageUrl: string): Promise<void> {
    try {
      // Extraer el path de la URL de Firebase
      const path = decodeURIComponent(imageUrl)
        .split('/o/')[1]
        .split('?')[0]
        .replace(/%2F/g, '/');
      
      const fileRef = ref(storage, path);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
}; 