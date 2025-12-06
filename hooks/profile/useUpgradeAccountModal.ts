import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuth from '@/hooks/auth/useAuth';
import useVerificationBadge from '@/hooks/profile/useVerificationBadge';

const UPGRADE_MODAL_STORAGE_KEY = '@upgrade_modal_settings';
const REQUIRED_VISITS = 3; // Show modal after 3 visits (once only)

interface UpgradeModalSettings {
  lastShown: number | null;
  dismissed: boolean;
  viewCount: number;
}

export const useUpgradeAccountModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [modalSettings, setModalSettings] = useState<UpgradeModalSettings>({
    lastShown: null,
    dismissed: false,
    viewCount: 0,
  });
  
  const { userDetails } = useAuth();
  const { data: verificationData, isLoading: isLoadingVerification } = useVerificationBadge();

  // Check if user is already verified
  const isUserVerified = verificationData?.data?.isVerified || false;

  // Load modal settings from storage
  useEffect(() => {
    loadModalSettings();
  }, []);

  const loadModalSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(UPGRADE_MODAL_STORAGE_KEY);
      if (stored) {
        const settings: UpgradeModalSettings = JSON.parse(stored);
        setModalSettings(settings);
      }
      setSettingsLoaded(true);
    } catch (error) {
      console.error('Error loading upgrade modal settings:', error);
      setSettingsLoaded(true); // Still mark as loaded even on error
    }
  };

  const saveModalSettings = async (settings: UpgradeModalSettings) => {
    try {
      await AsyncStorage.setItem(UPGRADE_MODAL_STORAGE_KEY, JSON.stringify(settings));
      setModalSettings(settings);
    } catch (error) {
      console.error('Error saving upgrade modal settings:', error);
    }
  };

  // Check if modal should be shown (show only once)
  const shouldShowModal = (): boolean => {
    if (!userDetails) return false;
    if (isLoadingVerification) return false; // Wait for verification data to load
    if (isUserVerified) return false; // Don't show to verified users
    if (modalSettings.dismissed) return false; // User dismissed
    if (modalSettings.lastShown) return false; // Already shown once
    
    // Show modal only if user has visited multiple times and never seen it before
    return modalSettings.viewCount >= REQUIRED_VISITS;
  };

  // Trigger modal check (call this when user navigates to profile/home)
  const triggerModalCheck = () => {
    // Don't do anything if verification is still loading or modal settings haven't been loaded yet
    if (isLoadingVerification || !settingsLoaded) return;
    
    if (!shouldShowModal()) {
      // Only increment view count for non-verified users
      if (!isUserVerified) {
        const newSettings = {
          ...modalSettings,
          viewCount: modalSettings.viewCount + 1,
        };
        saveModalSettings(newSettings);
      }
      return;
    }

    // Show the modal
    setShowModal(true);
    
    // Update last shown time
    const newSettings = {
      ...modalSettings,
      lastShown: Date.now(),
      viewCount: modalSettings.viewCount + 1,
    };
    saveModalSettings(newSettings);
  };

  // Close modal (temporary dismiss)
  const closeModal = () => {
    setShowModal(false);
  };

  // Permanently dismiss modal
  const dismissModal = () => {
    setShowModal(false);
    const newSettings = {
      ...modalSettings,
      dismissed: true,
    };
    saveModalSettings(newSettings);
  };

  // Reset modal settings (for testing purposes)
  const resetModalSettings = async () => {
    const newSettings: UpgradeModalSettings = {
      lastShown: null,
      dismissed: false,
      viewCount: 0,
    };
    await saveModalSettings(newSettings);
  };

  return {
    showModal,
    triggerModalCheck,
    closeModal,
    dismissModal,
    resetModalSettings, // For testing
    isUserVerified,
    modalSettings, // For debugging
  };
};