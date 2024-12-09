export interface SiteInfo {
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