import useSWR from 'swr';
import { SiteInformation, getSiteInformation } from '../utils/siteInfo';

const fetcher = () => getSiteInformation();

export function useSiteInfo() {
  const { data, error, mutate } = useSWR<SiteInformation>('site-info', fetcher);

  return {
    siteInfo: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}