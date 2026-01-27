import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

type LoadingContextType = {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}

      {loading &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.25)',
              zIndex: 2147483647,
              transform: 'translateZ(0)'
            }}
          >
            <div className="matrix-loader">
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
              <div className="matrix-loader-cell"></div>
            </div>
          </div>,
          document.body
        )}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
};

// Note: intentionally not exporting a default to keep exports stable for HMR
