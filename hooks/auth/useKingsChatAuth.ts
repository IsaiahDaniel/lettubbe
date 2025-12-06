import { useState } from 'react';
import { useKingsChatExchange } from './useKingsChatExchange';
import { handleError } from '@/helpers/utils/handleError';

export const useKingsChatAuth = () => {
  const [isWebViewVisible, setIsWebViewVisible] = useState(false);
  const [currentMode, setCurrentMode] = useState<'login' | 'signup'>('login');
  
  const mutation = useKingsChatExchange();

  const openKingsChatAuth = (mode: 'login' | 'signup') => {
    setCurrentMode(mode);
    setIsWebViewVisible(true);
  };

  const closeKingsChatAuth = () => {
    setIsWebViewVisible(false);
    mutation.reset();
  };

  const handleAuthSuccess = (code: string) => {
    mutation.mutate({ code, mode: currentMode });
  };

  const handleAuthError = (error: string) => {
    handleError(new Error(`KingsChat authentication failed: ${error}`));
    closeKingsChatAuth();
  };

  return {
    isWebViewVisible,
    isProcessing: mutation.isPending,
    openKingsChatAuth,
    closeKingsChatAuth,
    handleAuthSuccess,
    handleAuthError,
    isError: mutation.isError,
    error: mutation.error,
  };
};

export default useKingsChatAuth;