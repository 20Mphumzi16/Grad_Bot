import React, { createContext, useContext, useState } from 'react';

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

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="p-6 rounded-2xl bg-background/40 backdrop-blur-md flex items-center justify-center shadow-lg">
            <div className="orbit-loader">
              <div className="orbit-loader-dot" />
              <div className="orbit-loader-dot" />
              <div className="orbit-loader-dot" />
            </div>
          </div>
        </div>
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
