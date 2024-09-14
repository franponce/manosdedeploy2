import useSWR from 'swr';
import { SiteInformation, DEFAULT_SITE_INFORMATION } from '../utils/siteInfo';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useSiteInfo() {
  const { data, error, mutate } = useSWR<SiteInformation>('/api/site-info', fetcher);

  const updateSiteInfo = async (newInfo: Partial<SiteInformation>) => {
    try {
      const response = await fetch('/api/site-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInfo),
      });
      if (!response.ok) throw new Error('Failed to update site info');
      const updatedInfo = { ...(data || DEFAULT_SITE_INFORMATION), ...newInfo };
      mutate(updatedInfo, false);
      return updatedInfo;
    } catch (error) {
      console.error('Error updating site info:', error);
      throw error;
    }
  };

  return {
    siteInfo: data || DEFAULT_SITE_INFORMATION,
    isLoading: !error && !data,
    isError: error,
    updateSiteInfo,
  };
}