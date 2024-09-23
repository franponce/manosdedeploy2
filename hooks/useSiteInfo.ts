import useSWR from 'swr';
import { getSiteInformation, SiteInformation } from '../utils/firebase';

const fetcher = () => getSiteInformation();

export function useSiteInfo() {
  const { data, error, mutate } = useSWR<SiteInformation>('site-info', fetcher);

  return {
    siteInfo: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  };
}