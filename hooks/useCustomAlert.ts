import { useState } from 'react';

interface AlertConfig {
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
}

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
    setIsVisible(true);
  };

  const hideAlert = () => {
    setIsVisible(false);
    setAlertConfig(null);
  };

  // Simplified methods for common alert patterns
  const showInfo = (title: string, message: string, onOk?: () => void) => {
    showAlert({
      title,
      message,
      primaryButton: {
        text: 'OK',
        onPress: onOk || hideAlert,
      },
    });
  };

  const showInfoOnly = (title: string, message: string) => {
    showAlert({
      title,
      message,
      variant: 'info-only',
    });
  };

  const showError = (title: string, message: string, onOk?: () => void) => {
    showAlert({
      title,
      message,
      primaryButton: {
        text: 'OK',
        onPress: onOk || hideAlert,
      },
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant: 'primary' | 'danger' = 'primary'
  ) => {
    showAlert({
      title,
      message,
      primaryButton: {
        text: confirmText,
        onPress: () => {
          onConfirm();
          hideAlert();
        },
        variant,
      },
      secondaryButton: {
        text: cancelText,
        onPress: () => {
          onCancel?.();
          hideAlert();
        },
      },
    });
  };

  return {
    alertConfig,
    isVisible,
    showAlert,
    hideAlert,
    showInfo,
    showInfoOnly,
    showError,
    showConfirm,
  };
};