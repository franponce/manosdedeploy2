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
  
  export const DEFAULT_SITE_INFORMATION: SiteInformation = {
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
    avatar: ""
  };
  
  let siteInformation: SiteInformation = { ...DEFAULT_SITE_INFORMATION };
  
  export const getSiteInformation = (): SiteInformation => {
    return siteInformation;
  };
  
  export const updateSiteInformation = (newInfo: Partial<SiteInformation>): void => {
    siteInformation = { ...siteInformation, ...newInfo };
  };
  
  // Si necesitas una función para resetear la información a los valores por defecto
  export const resetSiteInformation = (): void => {
    siteInformation = { ...DEFAULT_SITE_INFORMATION };
  };
  
  // Si necesitas una función para actualizar un campo específico
  export const updateSiteInformationField = (field: keyof SiteInformation, value: any): void => {
    siteInformation = { ...siteInformation, [field]: value };
  };
  
  // Si necesitas una función para actualizar la información social
  export const updateSocialInformation = (name: string, url: string): void => {
    const updatedSocial = siteInformation.social.map(item => 
      item.name === name ? { ...item, url } : item
    );
    siteInformation = { ...siteInformation, social: updatedSocial };
  };