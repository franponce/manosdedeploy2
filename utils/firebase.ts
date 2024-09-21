import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
export interface SiteInformation {
  title: string;
  description: string;
  description2: string;
  whatsappCart: string;
  sheet: string;
  color: string;
  social: Array<{ name: string; url: string }>;
  logoUrl: string;
  bannerUrl: string;
}

export const DEFAULT_SITE_INFORMATION: SiteInformation = {
    title: "Manos de manteca",
    description: "Envianos tu pedido y a la brevedad te respondemos.",
    description2: "👉 Nuestro horario de atención es de X a X de X a X hs. Hacemos envíos 🚴‍♀",
    whatsappCart: "54929542201999",
    sheet: "https://docs.google.com/spreadsheets/d/e/2PACX-1vReSQMLVR-O0uKqZr28Y9j29RN1YYoaFkb29qVJjofGNZSRUnhCsgoohDDDrsAV0FW4R9xdulrn0aYE/pub?output=csv",
    color: "teal",
    social: [
        { name: "instagram", url: "https://www.hola.com" },
        { name: "whatsapp", url: "https://wa.me/54929542201999" }
    ],
    logoUrl: "/default-logo.png",
    bannerUrl: "/default-banner.jpg"
};

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
  
  export async function updateSiteInformation(newInfo: Partial<SiteInformation>): Promise<void> {
    const docRef = doc(db, "siteInfo", "main");
    await setDoc(docRef, newInfo, { merge: true });
  }
  
  export async function uploadImage(file: File, type: 'logo' | 'banner'): Promise<string> {
    const storageRef = ref(storage, `${type}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }