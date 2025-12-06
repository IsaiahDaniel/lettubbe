import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import CustomBottomSheet from "./CustomBottomSheet";
import { UploadMainMenu } from "./UploadMainMenu";
import { UploadGalleryView } from "./UploadGalleryView";
import FolderSelectionScreen from "./FolderSelectionScreen";
import { useVideoUploadModal } from "@/hooks/upload/useVideoUploadModal";
import { useCustomTheme } from "@/hooks/useCustomTheme";

const VideoUploadModal = () => {
  const { theme } = useCustomTheme();
  const {
    isModalVisible,
    isGalleryVisible,
    isFolderSelectionVisible,
    selectedAlbum,
    albums,
    hasDrafts,
    uploadMode,
    isLoadingAlbums,
    handleNewVideoPress,
    handleNewPhotoPress,
    handleDraftsPress,
    handleCloseModal,
    handleGalleryClose,
    handleAlbumSelectorPress,
    handleAlbumChange,
    hideFolderSelection,
  } = useVideoUploadModal();

  // Main menu with option cards
  const renderMainMenu = () => (
    <UploadMainMenu
      onVideoPress={handleNewVideoPress}
      onPhotoPress={handleNewPhotoPress}
    />
  );

  // Render folder selection view
  const renderFolderSelectionView = () => (
    <FolderSelectionScreen
      albums={albums}
      onSelectAlbum={handleAlbumChange}
      onBack={hideFolderSelection}
      uploadMode={uploadMode as any}
    />
  );

  // Render loading view
  const renderLoadingView = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" />
      <Typography 
        weight="500" 
        size={16} 
        textType="secondary" 
        style={styles.loadingText}
      >
        Loading {uploadMode === 'video' ? 'videos' : 'photos'}...
      </Typography>
    </View>
  );

  // Render gallery view
  const renderGalleryView = () => {
    // Show loading if albums are being fetched and no album selected yet
    if (isLoadingAlbums && !selectedAlbum) {
      return renderLoadingView();
    }
    
    return (
      <UploadGalleryView
        selectedAlbum={selectedAlbum}
        onAlbumSelectorPress={handleAlbumSelectorPress}
        onClose={handleGalleryClose}
      />
    );
  };

  // Determine modal content based on state
  const renderContent = () => {
    if (isFolderSelectionVisible) {
      return renderFolderSelectionView();
    }
    if (isGalleryVisible) {
      return renderGalleryView();
    }
    // Always show main menu when not in gallery or folder selection
    return renderMainMenu();
  };

  return (
    <CustomBottomSheet
      isVisible={isModalVisible}
      onClose={handleCloseModal}
      showClose={!isGalleryVisible || !selectedAlbum}
      showCloseIcon={!isGalleryVisible || !selectedAlbum}
      sheetheight={!isGalleryVisible ? "auto" : "90%"}
      title={
        isGalleryVisible && selectedAlbum ? selectedAlbum.title : ""
      }
      hasDrafts={hasDrafts}
      onDraftsPress={handleDraftsPress}
      showDraftsIcon={!isGalleryVisible}
    >
      {renderContent()}
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
  },
});

export default VideoUploadModal;
