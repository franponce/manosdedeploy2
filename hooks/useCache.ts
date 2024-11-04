import useSWR, { SWRConfiguration } from 'swr';
import { Cache, cacheInstance } from '../utils/cache';

interface CacheConfig extends SWRConfiguration {
  ttl?: number;
  forceValidate?: boolean;
}

export function useCache<T>(key: string, fetcher: () => Promise<T>, config?: CacheConfig) {
  const {
    ttl = 300, // 5 minutos por defecto
    forceValidate = false,
    ...swrConfig
  } = config || {};

  return useSWR<T>(
    key,
    async () => {
      try {
        // Intentar obtener del caché primero
        const cachedData = await cacheInstance.get<T>(key);
        if (cachedData !== null && !forceValidate) {
          return cachedData;
        }

        // Si no está en caché o se fuerza la validación, obtener datos frescos
        const freshData = await fetcher();
        await cacheInstance.set(key, freshData, ttl);
        return freshData;
      } catch (error) {
        console.error('Cache error:', error);
        return fetcher();
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: ttl * 1000,
      ...swrConfig,
    }
  );
} 