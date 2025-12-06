import React, { createContext, useContext, ReactNode } from 'react';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import CustomAlert from './CustomAlert';

interface AlertContextType {
  showInfo: (title: string, message: string, onOk?: () => void) => void;
  showInfoOnly: (title: string, message: string) => void;
  showError: (title: string, message: string, onOk?: () => void) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText?: string,
    cancelText?: string,
    variant?: 'primary' | 'danger'
  ) => void;
  showAlert: (config: {
    title: string;
    message: string;
    primaryButton?: {
      text: string;
      onPress: () => void;
      variant?: 'primary' | 'danger';
    };
    secondaryButton?: {
      text: string;
      onPress?: () => void;
    };
    variant?: 'default' | 'info-only';
  }) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const {
    alertConfig,
    isVisible,
    showAlert,
    hideAlert,
    showInfo,
    showInfoOnly,
    showError,
    showConfirm,
  } = useCustomAlert();

  const contextValue: AlertContextType = {
    showInfo,
    showInfoOnly,
    showError,
    showConfirm,
    showAlert,
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      {alertConfig && (
        <CustomAlert
          visible={isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          primaryButton={alertConfig.primaryButton}
          secondaryButton={alertConfig.secondaryButton}
          onClose={hideAlert}
          variant={alertConfig.variant}
        />
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};