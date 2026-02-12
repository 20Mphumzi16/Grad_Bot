import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SessionExpiredModal } from './SessionExpiredModal';
import { triggerSessionExpired } from '../utils/session';

export function GlobalLayout() {
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Check for 401 Unauthorized
        if (response.status === 401) {
          const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
          
          // Ignore 401s from login endpoints (wrong credentials)
          if (!url.includes('/auth/login')) {
             triggerSessionExpired();
          }
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <>
      <Outlet />
      <SessionExpiredModal />
    </>
  );
}
