import React, { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { telemetry } from '@/services/telemetry';

interface TelemetryContextType {
  trackClick: (id: string, label: string) => void;
  trackFormSubmit: (formName: string, data?: any) => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Auto-track route changes
    telemetry.setRoute(location.pathname);
  }, [location]);

  const trackClick = (id: string, label: string) => {
    telemetry.trackClick(id, label);
  };

  const trackFormSubmit = (formName: string, data?: any) => {
    telemetry.log({
      event: 'FORM_SUBMIT',
      module: 'forms',
      message: `Submitted form: ${formName}`,
      metadata: data
    });
  };

  return (
    <TelemetryContext.Provider value={{ trackClick, trackFormSubmit }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
