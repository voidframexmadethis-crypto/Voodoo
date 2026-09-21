import { useEffect } from 'react';
import { useStore } from '../context/StoreContext';

export const AnalyticsTracker = () => {
  const { incrementAnalytics } = useStore();
  useEffect(() => {
    incrementAnalytics('siteVisits');
    
    // Very simple visitor tracking: only count if not already visited in this session
    if (!sessionStorage.getItem('VOODOO_BOOMIN_VISITED') && !sessionStorage.getItem('KRYPSIDE_VISITED')) {
      incrementAnalytics('uniqueVisitors');
      sessionStorage.setItem('VOODOO_BOOMIN_VISITED', 'true');
      sessionStorage.setItem('KRYPSIDE_VISITED', 'true');
    }
  }, []);
  return null;
};
