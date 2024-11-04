import useSWR, { Key, SWRConfiguration } from 'swr';
import { Cache, cacheInstance } from '../utils/cache';

interface CacheConfig extends SWRConfiguration {
  ttl?: number;
  forceValidate?: boolean;
}

interface CacheConfig {
  ttl?: number;
  forceValidate?: boolean;
  revalidateOnFocus?: boolean;
  revalidateIfStale?: boolean;
  refreshInterval?: number;
}

export function useCache<T>(
  key: Key,
  fetcher: () => Promise<T>,
  config?: CacheConfig
) {
  const {
    ttl = 300,
    forceValidate = false,
    ...swrConfig
  } = config || {};

  return useSWR<T>(
    key,
    async () => {
      try {
        if (!forceValidate) {
          const cachedData = await cacheInstance.get<T>(key?.toString() ?? '');
          if (cachedData !== null) {
            return cachedData;
          }
        }
        const freshData = await fetcher();
        await cacheInstance.set(key?.toString() ?? '', freshData, ttl);
        return freshData;
      } catch (error) {
        console.error('Cache error:', error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: ttl * 1000,
      ...swrConfig,
    }
  );
}