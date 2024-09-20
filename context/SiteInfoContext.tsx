import React, { createContext, useState, useContext, useEffect } from 'react';
import { SiteInformation, getSiteInformation, DEFAULT_SITE_INFORMATION } from '../utils/siteInfo';

const SiteInfoContext = createContext<{
  siteInfo: SiteInformation;
  updateSiteInfo: (newInfo: Partial<SiteInformation>) => void;
}>({
  siteInfo: DEFAULT_SITE_INFORMATION,
  updateSiteInfo: () => {},
});

export const useSiteInfo = () => useContext(SiteInfoContext);

export const SiteInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteInfo, setSiteInfo] = useState<SiteInformation>(DEFAULT_SITE_INFORMATION);

  useEffect(() => {
    const fetchSiteInfo = async () => {
      const info = await getSiteInformation();
      setSiteInfo(info);
    };
    fetchSiteInfo();
  }, []);

  const updateSiteInfo = (newInfo: Partial<SiteInformation>) => {
    setSiteInfo(prevInfo => ({ ...prevInfo, ...newInfo }));
  };

  return (
    <SiteInfoContext.Provider value={{ siteInfo, updateSiteInfo }}>
      {children}
    </SiteInfoContext.Provider>
  );
};