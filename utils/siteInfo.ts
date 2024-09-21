import { kv } from '@vercel/kv';

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

let cachedSiteInfo: SiteInformation | null = null;

export async function getSiteInformation(): Promise<SiteInformation> {
  console.log('Iniciando getSiteInformation');
  if (typeof window !== 'undefined') {
    console.log('Ejecutando en el cliente, devolviendo caché o valor por defecto');
    return cachedSiteInfo || DEFAULT_SITE_INFORMATION;
  }

  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      console.log('Vercel KV está configurado, intentando obtener información');
      const storedInfo = await kv.get('site_information') as SiteInformation | null;
      if (storedInfo) {
        console.log('Información obtenida de Vercel KV');
        cachedSiteInfo = { ...DEFAULT_SITE_INFORMATION, ...storedInfo };
        return cachedSiteInfo;
      }
    } else {
      console.warn('Vercel KV no está configurado. Usando información por defecto.');
    }
  } catch (error) {
    console.error('Error al obtener la información del sitio:', error);
  }

  console.log('Devolviendo información por defecto');
  return DEFAULT_SITE_INFORMATION;
}

export async function updateSiteInformation(newInfo: Partial<SiteInformation>): Promise<void> {
  console.log('Iniciando updateSiteInformation');
  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      console.log('Vercel KV está configurado');
      const currentInfo = await getSiteInformation();
      console.log('Información actual obtenida:', currentInfo);
      const updatedInfo = { ...currentInfo, ...newInfo };
      console.log('Información actualizada:', updatedInfo);
      await kv.set('site_information', updatedInfo);
      console.log('Información guardada en Vercel KV');
      cachedSiteInfo = updatedInfo;
    } else {
      console.warn('Vercel KV no está configurado. La información del sitio no se guardó.');
    }
  } catch (error) {
    console.error('Error al actualizar la información del sitio:', error);
    throw error;
  }
}

export async function uploadImage(file: File, type: 'logo' | 'banner'): Promise<string> {
  // Implementa la lógica de carga de imágenes aquí
  // Por ahora, simplemente devolvemos una URL ficticia
  console.log(`Simulando carga de imagen de tipo: ${type}`);
  return `https://example.com/${type}-${Date.now()}.jpg`;
}