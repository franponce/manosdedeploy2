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
  bannerText?: string;
}

export const DEFAULT_SITE_INFORMATION: SiteInformation = {
  title: "Cargando tienda...",
  description: "Estamos preparando todo para mostrarte los mejores productos",
  description2: "¡En unos segundos podrás ver todo el catálogo! 🛍️",
  whatsappCart: "",
  sheet: "",
  color: "teal",
  social: [
    {
      name: "instagram",
      url: "#"
    },
    {
      name: "whatsapp",
      url: "#"
    }
  ],
  logoUrl: "",
  bannerUrl: "",
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
  const docRef = doc(db, "siteInfo", "main");
  const docSnap = await getDoc(docRef);
    
  if (docSnap.exists()) {
    return docSnap.data() as SiteInformation;
  }
  
  throw new Error('No site information found');
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

interface StockDocument {
  quantity: number;
  available: number;
}

export const stockService = {
  async initializeStockDocument(productId: string): Promise<void> {
    const stockRef = doc(db, 'stock', productId);
    
    try {
      const stockDoc = await getDoc(stockRef);
      
      if (!stockDoc.exists()) {
        await setDoc(stockRef, {
          quantity: 0,
          available: 0
        });
      } else {
        const updates: Partial<StockDocument> = {};
        const data = stockDoc.data();
        
        if (typeof data.available !== 'number') {
          updates.available = data.quantity || 0;
        }
        
        if (Object.keys(updates).length > 0) {
          await updateDoc(stockRef, updates);
        }
      }
    } catch (error) {
      console.error('Error initializing stock document:', error);
      throw error;
    }
  },

  async updateStock(productId: string, quantity: number): Promise<void> {
    const stockRef = doc(db, 'stock', productId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const stockDoc = await transaction.get(stockRef);
        const newQuantity = Number(quantity) || 0;
        
        if (!stockDoc.exists()) {
          transaction.set(stockRef, {
            quantity: newQuantity,
            available: newQuantity
          });
        } else {
          transaction.update(stockRef, {
            quantity: newQuantity,
            available: newQuantity
          });
        }
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  async getAvailableStock(productId: string): Promise<number> {
    try {
      const stockRef = doc(db, 'stock', productId);
      const stockDoc = await getDoc(stockRef);
      
      return stockDoc.data()?.available || 0;
    } catch (error) {
      console.error('Error getting available stock:', error);
      return 0;
    }
  },

  async getProductStock(productId: string): Promise<number> {
    try {
      const stockRef = doc(db, 'stock', productId);
      const stockDoc = await getDoc(stockRef);
      
      if (!stockDoc.exists()) {
        return 0;
      }

      const stockData = stockDoc.data() as StockDocument;
      return stockData.quantity || 0;
    } catch (error) {
      console.error('Error getting product stock:', error);
      return 0;
    }
  }
};

export { auth, db, storage };
