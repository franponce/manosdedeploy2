import useSWR, { Key, SWRConfiguration } from 'swr';
import { cacheInstance } from '../utils/cache/instance';
import { CACHE_CONFIG } from '../utils/cache/config';

interface CacheConfig extends SWRConfiguration {
  ttl?: number;
  forceValidate?: boolean;
}

export function useCache<T>(
  key: Key,
  fetcher: () => Promise<T>,
  config?: CacheConfig
) {
  const {
    ttl = CACHE_CONFIG.TTL.DEFAULT,
    forceValidate = false,
    ...swrConfig
  } = config || {};

  return useSWR<T>(
    key,
    async () => {
      try {
        if (!forceValidate) {
          const cachedData = await cacheInstance.get<T>(key?.toString() ?? '', false);
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
      revalidateOnFocus: CACHE_CONFIG.REVALIDATION.ON_FOCUS,
      revalidateOnReconnect: CACHE_CONFIG.REVALIDATION.ON_RECONNECT,
      dedupingInterval: ttl * 1000,
      ...swrConfig,
    }
  );
}