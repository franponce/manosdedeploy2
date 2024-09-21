import React, { createContext, useState, useContext, useEffect } from 'react';
import { SiteInformation, DEFAULT_SITE_INFORMATION, getSiteInformation } from '../utils/firebase';

interface SiteInfoContextType {
  siteInfo: SiteInformation;
  updateSiteInfo: (newInfo: Partial<SiteInformation>) => void;
}

const SiteInfoContext = createContext<SiteInfoContextType>({
  siteInfo: DEFAULT_SITE_INFORMATION,
  updateSiteInfo: () => {},
});

export const useSiteInfo = () => useContext(SiteInfoContext);

export const SiteInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteInfo, setSiteInfo] = useState<SiteInformation>(DEFAULT_SITE_INFORMATION);

  useEffect(() => {
    const fetchSiteInfo = async () => {
      try {
        const info = await getSiteInformation();
        setSiteInfo(info);
      } catch (error) {
        console.error('Error fetching site information:', error);
      }
    };
    fetchSiteInfo();
  }, []);

  const updateSiteInfo = (newInfo: Partial<SiteInformation>) => {
    setSiteInfo((prevInfo: SiteInformation) => ({ ...prevInfo, ...newInfo }));
  };

  return (
    <SiteInfoContext.Provider value={{ siteInfo, updateSiteInfo }}>
      {children}
    </SiteInfoContext.Provider>
  );
};