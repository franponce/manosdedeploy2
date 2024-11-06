export const CACHE_KEYS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  SITE_INFO: 'site-info',
  STOCK: (productId: string) => `stock:${productId}`,
} as const;

export const CACHE_CONFIG = {
  TTL: {
    DEFAULT: 5 * 60, // 5 minutos
    PRODUCTS: 10 * 60, // 10 minutos
    CATEGORIES: 15 * 60, // 15 minutos
    SITE_INFO: 30 * 60, // 30 minutos
    STOCK: 2 * 60, // 2 minutos
  },
  REVALIDATION: {
    ON_FOCUS: false,
    ON_RECONNECT: false,
    INTERVAL: {
      PRODUCTS: 60 * 1000, // 1 minuto
      STOCK: 30 * 1000, // 30 segundos
    },
  },
} as const; 