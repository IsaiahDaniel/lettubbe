import FolderSelectionScreen from "@/components/shared/videoUpload/FolderSelectionScreen";
import useVideoUploadStore, { Album } from "@/store/videoUploadStore";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useCustomTheme } from "../useCustomTheme";
import { useRef, useEffect } from "react";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { Feather } from "@expo/vector-icons";
import RemixIcon from "react-native-remix-icon";
import MediaGalleryPicker from "@/components/shared/videoUpload/MediaGalleryPicker";
import DocumentPicker from "@/components/shared/chat/fileSharing/DocumentPicker";

const useAlbumViews = (uploadMode: any, chatFunctions?: {
  setUploadedImageUrls?: (urls: string[]) => void;
  setUploadedVideoUrls?: (urls: string[]) => void;
  setChatMessage?: (message: string) => void;
  handleSendChat?: () => void;
  sendMediaMessage?: (caption: string, mediaAssets: any[]) => void;
  closeModal?: () => void;
}) => {
  // console.log("uploadMode", uploadMode);

  const albumSelectorRef = useRef<View>(null);
  const { theme } = useCustomTheme();

  const {
    closeUploadModal,
    isGalleryVisible,
    hideGallery,
    showGallery,
    isFolderSelectionVisible,
    showFolderSelection,
    hideFolderSelection,
    selectedAlbum,
    setSelectedAlbum,
    albums,
  } = useVideoUploadStore();

  const handleAlbumSelectorPress = () => {
    showFolderSelection();
  };

  const handleCloseModal = () => {
    hideGallery();
    hideFolderSelection();
    setSelectedAlbum(null);
    closeUploadModal();
  };

  // Handle automatic album selection for audio files
  useEffect(() => {
    if (uploadMode === 'audio' && !selectedAlbum) {
      // Use setTimeout to avoid setState during render
      const timer = setTimeout(() => {
        setSelectedAlbum({ id: 'recents', title: 'All Audio', assetCount: 0 });
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [uploadMode, selectedAlbum, setSelectedAlbum]);

  // console.log("selectedAlbum", selectedAlbum);

  // close entire modal
  const handleGalleryClose = () => {
    // Close the entire modal rather than just hiding gallery
    handleCloseModal();
  };

  // Render gallery view
  const renderChatsGalleryView = () => {
    // Handle document picker differently - doesn't need album selection
    if (uploadMode === 'document') {
      return (
        <View style={styles.container}>
          <DocumentPicker 
            chatFunctions={chatFunctions}
            onClose={handleCloseModal}
          />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {selectedAlbum && (
          <>
            <MediaGalleryPicker selectedAlbum={selectedAlbum} chatFunctions={chatFunctions} />
          </>
        )}
      </View>
    );
  };

  const handleAlbumChange = (album: Album) => {
    setSelectedAlbum(album);
    hideFolderSelection();
  };

  // Determine modal content based on state
  const renderContent = () => {
    // console.log("isFolderSelectionVisible", isFolderSelectionVisible);
    // console.log("isGalleryVisible", isGalleryVisible);
    
    // For documents, skip folder selection and go directly to document picker
    if (uploadMode === 'document') {
      return renderChatsGalleryView();
    }
    
    // For audio files, skip folder selection and show all audio files directly
    if (uploadMode === 'audio') {
      // Wait for selectedAlbum to be set by useEffect
      if (!selectedAlbum) {
        return null; // useEffect will set the album
      }
      return renderChatsGalleryView();
    }
    
    // For videos and photos, start with folder selection if no album is selected
    // OR if explicitly navigated back to folder selection
    // Also check if albums are loaded to prevent showing empty folder selection
    if ((!selectedAlbum || isFolderSelectionVisible) && albums.length > 0) {
      return renderFolderSelectionView();
    }
    
    // Show loading or wait for albums to load
    if (albums.length === 0) {
      return null; // Albums are still loading
    }
    
    // Show gallery only after an album has been selected and not in folder selection mode
    return renderChatsGalleryView();
  };

  const renderFolderSelectionView = () => {
    // For file sharing flow, never show back button on folder selection
    // Folder selection is always the starting point
    return (
      <FolderSelectionScreen
        albums={albums}
        onSelectAlbum={handleAlbumChange}
        onBack={handleCloseModal}
        uploadMode={uploadMode as any}
        showBackButton={false}
      />
    );
  };

  return {
    renderFolderSelectionView,
    renderContent,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%"
  },
});

export default useAlbumViews;
