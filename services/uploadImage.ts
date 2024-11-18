import { getAuth } from "firebase/auth";

import { getDownloadURL, getStorage } from "firebase/storage";

import { ref } from "firebase/storage";

import { uploadBytes } from "firebase/storage";

export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    // Verificar que el usuario está autenticado
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error("Usuario no autenticado");
    }

    // Verificar el tipo de archivo
    if (!file.type.match('image.*')) {
      throw new Error("El archivo debe ser una imagen");
    }

    // Verificar el tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("La imagen no debe superar los 5MB");
    }

    const storage = getStorage();
    const storageRef = ref(storage, path);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
} 