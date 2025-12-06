import { useState, useEffect, useCallback } from "react";
import { BackHandler } from "react-native";
import { useHomeTabSafe } from "@/contexts/HomeTabContext";

interface UseProfileModalStateProps {
  isVisible: boolean;
  onClose: () => void;
}

export const useProfileModalState = ({ isVisible, onClose }: UseProfileModalStateProps) => {
  const [selectedFilter, setSelectedFilter] = useState("Maris");
  const [activeView, setActiveView] = useState<"profile" | "about">("profile");
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  
  const homeTabContext = useHomeTabSafe();
  const pauseBackgroundAutoplay = homeTabContext?.pauseBackgroundAutoplay;
  const resumeBackgroundAutoplay = homeTabContext?.resumeBackgroundAutoplay;

  const handleMenuOptionSelect = useCallback((option: string, blockHandler?: () => void, unblockHandler?: () => void) => {
    setSelectedFilter(option);

    switch (option) {
      case "About":
        setActiveView("about");
        break;
      case "Report":
        setIsReportModalVisible(true);
        break;
      case "Block":
        blockHandler?.();
        break;
      case "Unblock":
        unblockHandler?.();
        break;
    }
  }, []);

  const handleCloseReportModal = useCallback(() => {
    setIsReportModalVisible(false);
  }, []);

  const handleBackToProfile = useCallback(() => {
    setActiveView("profile");
  }, []);

  const getMenuOptions = useCallback(() => {
    const baseOptions = [{ name: "About" }];
    baseOptions.push({ name: "Report" });
    return baseOptions;
  }, []);

  // Reset to profile view when component closes
  useEffect(() => {
    if (!isVisible) {
      const timer = setTimeout(() => {
        setActiveView("profile");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (isVisible) {
        onClose();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isVisible, onClose]);

  // Pause background autoplay when modal opens
  useEffect(() => {
    if (isVisible) {
      pauseBackgroundAutoplay?.();
    } else {
      resumeBackgroundAutoplay?.();
    }

    return () => {
      resumeBackgroundAutoplay?.();
    };
  }, [isVisible]);

  return {
    selectedFilter,
    activeView,
    isReportModalVisible,
    handleMenuOptionSelect,
    handleCloseReportModal,
    handleBackToProfile,
    getMenuOptions,
  };
};