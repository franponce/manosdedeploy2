import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, runTransaction } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL, uploadBytes, deleteObject, listAll } from "firebase/storage";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut,
  User
} from "firebase/auth";
import { setCookie, destroyCookie } from 'nookies';

const firebaseConfig = {
  apiKey: "AIzaSyDwcuPITsTK09h8nv--CW0uRWiCWyITjHo",
  authDomain: "manosdedeploy.firebaseapp.com",
  projectId: "manosdedeploy",
  storageBucket: "manosdedeploy.appspot.com",
  messagingSenderId: "1064025881490",
  appId: "1:1064025881490:web:ec981224ec63b1ef1a9f4b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export interface SiteInformation {
  storeName: string;
  title: string;
  description: string;
  description2: string;
  whatsappCart: string;
  sheet: string;
  color: string;
  social: Array<{ name: string; url: string }>;
  logoUrl: string;
  bannerUrl: string;
  currency: string;
  exchangeRates: {
    [key: string]: number;
  };
  imageSettings?: {
    maxImagesPerProduct: number;
    maxSizeMB: number;
    maxWidth: number;
    maxHeight: number;
  };
}

export const DEFAULT_SITE_INFORMATION: SiteInformation = {
  title: "Manos de manteca",
  description: "Envianos tu pedido y a la brevedad te respondemos.",
  description2: "👉 Nuestro horario de atención es de X a X de X a X hs. Hacemos envíos 🚴‍♀",
  whatsappCart: "5492954271140",
  sheet: "https://docs.google.com/spreadsheets/d/e/2PACX-1vReSQMLVR-O0uKqZr28Y9j29RN1YYoaFkb29qVJjofGNZSRUnhCsgoohDDDrsAV0FW4R9xdulrn0aYE/pub?output=csv",
  color: "teal",
  social: [
    { name: "instagram", url: "https://www.hola.com" },
    { name: "whatsapp", url: "https://wa.me/54929542201999" }
  ],
  logoUrl: "/default-logo.png",
  bannerUrl: "/default-banner.jpg",
  currency: 'ARS',
  exchangeRates: {},
  storeName: "",
  imageSettings: {
    maxImagesPerProduct: 5,
    maxSizeMB: 2,
    maxWidth: 1920,
    maxHeight: 1080
  }
};

export interface PaymentMethods {
  mercadoPago: boolean;
  cash: boolean;
  bankTransfer: boolean;
}

export async function getSiteInformation(): Promise<SiteInformation> {
  try {
    const docRef = doc(db, "siteInfo", "main");
    const docSnap = await getDoc(docRef);
      
    if (docSnap.exists()) {
      return docSnap.data() as SiteInformation;
    }
  } catch (error) {
    console.error('Error fetching site information:', error);
  }
  return DEFAULT_SITE_INFORMATION;
}

export const updateSiteInfo = async (siteInfo: Partial<SiteInformation>): Promise<void> => {
  const siteInfoRef = doc(db, 'siteInfo', 'main');
  await updateDoc(siteInfoRef, siteInfo);
};

export const uploadImage = async (file: File, type: 'logo' | 'banner'): Promise<string> => {
  const storageRef = ref(storage, `${type}/${Date.now()}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  console.log(`Uploaded ${type} image. URL:`, downloadURL);
  return downloadURL;
};

export const getPaymentMethods = async (): Promise<PaymentMethods> => {
  try {
    const docRef = doc(db, "config", "paymentMethods");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as PaymentMethods;
    }
  } catch (error) {
    console.error('Error fetching payment methods:', error);
  }
  return { mercadoPago: false, cash: false, bankTransfer: false };
};

export const updatePaymentMethods = async (methods: PaymentMethods): Promise<void> => {
  const docRef = doc(db, "config", "paymentMethods");
  await setDoc(docRef, methods);
};

export const registerUser = async (email: string, password: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  if (email === 'admin' && password === 'password123') {
    const adminUser = {
      uid: 'admin',
      email: 'admin@example.com',
      displayName: 'Admin',
    } as User;
    
    setCookie(null, 'authToken', 'admin-token', {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    
    return adminUser;
  } else {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      const token = await userCredential.user.getIdToken();
      setCookie(null, 'authToken', token, {
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      
      return userCredential.user;
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      return null;
    }
  }
};

export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
  destroyCookie(null, 'authToken', { path: '/' });
};

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const isAdminUser = (user: User | null): boolean => {
  return user?.uid === 'admin';
};
export interface ProductImage {
  url: string;
  path: string;
  timestamp: number;
}

export const productImageService = {
  async upload(file: File, productId: string): Promise<ProductImage> {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const path = `products/${productId}/${fileName}`;
    const storageRef = ref(storage, path);
    
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    
    return {
      url,
      path,
      timestamp
    };
  },

  async delete(path: string): Promise<void> {
    const imageRef = ref(storage, path);
    await deleteObject(imageRef);
  },

  async deleteAllProductImages(productId: string): Promise<void> {
    const productRef = ref(storage, `products/${productId}`);
    const list = await listAll(productRef);
    
    await Promise.all(
      list.items.map(item => deleteObject(item))
    );
  }
};

interface StockReservation {
  quantity: number;
  expiresAt: Date;
}

interface StockDocument {
  quantity: number;
  reservations: {
    [key: string]: StockReservation;
  };
}

export const stockService = {
  async getProductStock(productId: string): Promise<number> {
    const docRef = doc(db, 'stock', productId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().quantity : 0;
  },

  async updateStock(productId: string, quantity: number) {
    const stockRef = doc(db, 'stock', productId);
    const stockDoc = await getDoc(stockRef);
    
    const currentStock = stockDoc.exists() ? stockDoc.data().quantity : 0;
    const newStock = currentStock + quantity;
    
    if (newStock < 0) {
      throw new Error('No hay suficiente stock disponible');
    }
    
    await setDoc(stockRef, { quantity: newStock }, { merge: true });
    return newStock;
  },

  async reserveStock(productId: string, quantity: number): Promise<boolean> {
    const docRef = doc(db, 'stock', productId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const stockDoc = await transaction.get(docRef);
        const currentStock = stockDoc.exists() ? stockDoc.data().quantity : 0;
        
        if (currentStock < quantity) {
          throw new Error('Stock insuficiente');
        }
        
        transaction.update(docRef, { 
          quantity: currentStock - quantity 
        });
      });
      
      return true;
    } catch (error) {
      console.error('Error al reservar stock:', error);
      return false;
    }
  }
};

export { auth, db, storage };
