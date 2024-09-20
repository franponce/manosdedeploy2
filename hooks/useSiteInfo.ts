import useSWR from 'swr';
import { SiteInformation, getSiteInformation, DEFAULT_SITE_INFORMATION } from '../utils/siteInfo';

const fetcher = () => getSiteInformation();

export function useSiteInfo() {
  const { data, error, mutate } = useSWR<SiteInformation>('site-info', fetcher, {
    fallbackData: DEFAULT_SITE_INFORMATION,
  });

  return {
    siteInfo: data || DEFAULT_SITE_INFORMATION,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}