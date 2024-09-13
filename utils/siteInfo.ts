import { GetServerSideProps } from 'next';

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
  avatar: ""
});

export const getSiteInformation = async (baseUrl: string): Promise<SiteInformation> => {
  try {
    const response = await fetch(`${baseUrl}/api/get-site-info`);
    if (!response.ok) {
      throw new Error('Failed to fetch site information');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching site information:', error);
    return getDefaultSiteInformation();
  }
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = context.req.headers.host || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  
  const siteInfo = await getSiteInformation(baseUrl);
  return { 
    props: { 
      siteInfo,
      baseUrl
    } 
  };
};