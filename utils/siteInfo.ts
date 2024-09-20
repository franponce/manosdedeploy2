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
  if (typeof window !== 'undefined') {
    return cachedSiteInfo || DEFAULT_SITE_INFORMATION;
  }

  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const storedInfo = await kv.get('site_information') as SiteInformation | null;
      if (storedInfo) {
        cachedSiteInfo = { ...DEFAULT_SITE_INFORMATION, ...storedInfo };
        return cachedSiteInfo;
      }
    }
  } catch (error) {
    console.error('Error fetching site information:', error);
  }

  return DEFAULT_SITE_INFORMATION;
}