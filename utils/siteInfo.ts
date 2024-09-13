export interface SiteInformation {
    title: string;
    description: string;
    description2: string;
    whatsappCart: string;
    sheet: string;
    color: string;
    social: Array<{ name: string; url: string }>;
    banner?: string;  
    avatar?: string;
  }
  
  export const getDefaultSiteInformation = (): SiteInformation => ({
    title: "Manos de manteca",
    description: "Envianos tu pedido y a la brevedad te respondemos.",
    description2: "👉 Nuestro horario de atención es de X a X de X a X hs. Hacemos envíos 🚴‍♀",
    whatsappCart: "54929542201999",
    sheet: "https://docs.google.com/spreadsheets/d/e/2PACX-1vReSQMLVR-O0uKqZr28Y9j29RN1YYoaFkb29qVJjofGNZSRUnhCsgoohDDDrsAV0FW4R9xdulrn0aYE/pub?output=csv",
    color: "teal",
    social: [
      {
        name: "instagram",
        url: "https://www.hola.com"
      },
      {
        name: "whatsapp",
        url: "https://wa.me/54929542201999"
      }
    ],
    banner: "", 
    avatar: "",
  });
  
  export const getSiteInformation = (): SiteInformation => {
    const siteInfoString = process.env.SITE_INFORMATION;
    if (!siteInfoString) {
      console.warn('SITE_INFORMATION environment variable is not set, using default values');
      return getDefaultSiteInformation();
    }
    try {
      return JSON.parse(siteInfoString) as SiteInformation;
    } catch (error) {
      console.error('Error parsing SITE_INFORMATION:', error);
      return getDefaultSiteInformation();
    }
  };