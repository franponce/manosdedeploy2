import useSWR from 'swr';
import { getSiteInformation, SiteInformation, DEFAULT_SITE_INFORMATION } from '../utils/firebase';

const fetcher = () => getSiteInformation();

export function useSiteInfo() {
  const { data, error, mutate } = useSWR<SiteInformation>('site-info', fetcher, {
    fallbackData: DEFAULT_SITE_INFORMATION,
    revalidateOnFocus: false,
    dedupingInterval: 5000, // Evita múltiples solicitudes en un corto período de tiempo
    shouldRetryOnError: true,
    errorRetryInterval: 5000,
    refreshInterval: 300000, // Revalidar cada 5 minutos
  });

  return {
    siteInfo: data || DEFAULT_SITE_INFORMATION,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}