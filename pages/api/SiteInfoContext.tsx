import React, { createContext, useState, useEffect, useContext } from 'react';
import { SiteInformation, DEFAULT_SITE_INFORMATION } from '../../utils/siteInfo';

const SiteInfoContext = createContext<{
  siteInfo: SiteInformation;
  updateSiteInfo: (newInfo: Partial<SiteInformation>) => void;
}>({
  siteInfo: DEFAULT_SITE_INFORMATION,
  updateSiteInfo: () => {},
});

export const SiteInfoProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [siteInfo, setSiteInfo] = useState<SiteInformation>(DEFAULT_SITE_INFORMATION);

  useEffect(() => {
    const storedInfo = localStorage.getItem('siteInfo');
    if (storedInfo) {
      setSiteInfo(JSON.parse(storedInfo));
    }
  }, []);

  const updateSiteInfo = (newInfo: Partial<SiteInformation>) => {
    const updatedInfo = { ...siteInfo, ...newInfo };
    setSiteInfo(updatedInfo);
    localStorage.setItem('siteInfo', JSON.stringify(updatedInfo));
  };

  return (
    <SiteInfoContext.Provider value={{ siteInfo, updateSiteInfo }}>
      {children}
    </SiteInfoContext.Provider>
  );
};

export const useSiteInfo = () => useContext(SiteInfoContext);