import { useEffect } from 'react';

const SCROLL_POSITION_KEY = 'scroll-position';

export function useScrollPosition(key: string) {
  const saveScrollPosition = () => {
    const position = window.scrollY;
    sessionStorage.setItem(`${SCROLL_POSITION_KEY}-${key}`, position.toString());
  };

  useEffect(() => {
    const savedPosition = sessionStorage.getItem(`${SCROLL_POSITION_KEY}-${key}`);
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
      sessionStorage.removeItem(`${SCROLL_POSITION_KEY}-${key}`);
    }
  }, [key]);

  return { saveScrollPosition };
} 