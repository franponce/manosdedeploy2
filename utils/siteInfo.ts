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
  // ... (mantén el contenido existente)
});

export const getSiteInformation = async (): Promise<SiteInformation> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-site-info`);
    if (!response.ok) {
      throw new Error('Failed to fetch site information');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching site information:', error);
    return getDefaultSiteInformation();
  }
};

export const getServerSideProps: GetServerSideProps = async () => {
  const siteInfo = await getSiteInformation();
  return { props: { siteInfo } };
};