import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Typography from "@/components/ui/Typography/Typography";
import RemixIcon from "react-native-remix-icon";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import useVideoUploadStore from "@/store/videoUploadStore";
import BackButton from "@/components/utilities/BackButton";
import { Feather } from "@expo/vector-icons";
import useUploadVideo from "@/hooks/upload/useUploadVideo";
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAlert } from "@/components/ui/AlertProvider";
import { BackHandler } from "react-native";

type PhotoItem = {
  id: string;
  uri: string;
  fileName?: string;
  width?: number;
  height?: number;
  type?: string;
};

export default function PhotoDetailsScreen() {
  const router = useRouter();
  const { theme } = useCustomTheme();

  const {
    handleUpload,
    isUploading,
    navigateToDetailsPage,
    postDetails,
  } = useUploadVideo();

  const { selectedPhotos, setSelectedPhotos, removeSelectedPhoto, reorderPhotos, savePhotoDraft, isDetailsScreen, closeDetailsScreen, openUploadModal, setUploadMode, showGallery, setSelectedAlbum, setAlbums } = useVideoUploadStore();
  const { showConfirm } = useAlert();

  // Navigate back to home and open modal with selections preserved
  const navigateBackToModal = () => {
    // Save the current photos before they get cleared
    const currentPhotos = [...selectedPhotos];

    // Manually set modal state using Zustand's setState to bypass openUploadModal reset
    useVideoUploadStore.setState({
      isModalVisible: true,
      isGalleryVisible: true,
      isFolderSelectionVisible: false,
      isDetailsScreen: false,
      uploadMode: "photo",
      selectedPhotos: currentPhotos,
      selectedAlbum: null,
      albums: [],
    });

    // Navigate to home after modal is set up
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);
  };

  // Photo draft saving functionality - DISABLED
  // const promptSaveDraft = () => {
  //   if (selectedPhotos.length === 0) {
  //     navigateBackToModal();
  //     return;
  //   }

  //   showConfirm(
  //     "Save Draft",
  //     "Do you want to save your photos as a draft?",
  //     async () => {
  //       try {
  //         await savePhotoDraft(selectedPhotos);
  //         navigateBackToModal();
  //       } catch (error) {
  //         console.error("Error saving photo draft:", error);
  //       }
  //     },
  //     () => {
  //       navigateBackToModal();
  //     },
  //     "Save Draft",
  //     "Discard",
  //     undefined
  //   );
  // };

  // back navigation without drafts
  const promptSaveDraft = () => {
    navigateBackToModal();
  };

  // Handle back button from header
  const handleBackPress = () => {
    navigateBackToModal();
  };

  // Hardware back button handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigateBackToModal();
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  // Convert photos to draggable format - derive from selectedPhotos directly
  const photoItems = selectedPhotos.map((photo, index) => ({
    id: `photo-${index}-${photo.uri}`, // More unique ID
    uri: photo.uri,
    fileName: photo.fileName,
    width: photo.width,
    height: photo.height,
    type: photo.type,
  }));

  const handleRemovePhoto = (index: number) => {
    showConfirm(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      () => removeSelectedPhoto(index),
      undefined,
      "Remove",
      "Cancel",
      "danger"
    );
  };

  const handleDragEnd = ({ from, to }: { data: PhotoItem[]; from: number; to: number }) => {
    // Only using the store's reorderPhotos function - don't manage local state
    if (from !== to) {
      reorderPhotos(from, to);
    }
  };

  const renderPhotoItem = ({ item, drag, isActive }: RenderItemParams<PhotoItem>) => {
    const index = selectedPhotos.findIndex(photo => photo.uri === item.uri);
    
    return (
      <ScaleDecorator activeScale={0.95}>
        <TouchableOpacity
          onLongPress={drag}
          activeOpacity={1}
          delayLongPress={100}
          style={[
            styles.photoItem,
            isActive && styles.activePhotoItem,
          ]}
        >
          <Image
            source={{ uri: item.uri }}
            style={styles.photoImage}
            resizeMode="cover"
          />
          
          {/* Remove button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemovePhoto(index)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RemixIcon name="close-line" size={16} color="#FFFFFF" />
          </TouchableOpacity>

        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: Colors[theme].background }]}
        edges={["top"]}
      >
        <StatusBar style={theme === "dark" ? "light" : "dark"} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton handlePress={handleBackPress} />
            <Typography size={18} weight="600">
              Photo Details
            </Typography>
          </View>
          {/* {selectedPhotos.length > 0 && (
            <TouchableOpacity
              onPress={promptSaveDraft}
              style={styles.draftButton}
            >
              <Typography size={14} weight="600" style={{ color: Colors.general.blue }}>
                Save Draft
              </Typography>
            </TouchableOpacity>
          )} */}
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo Management Section */}
          <View style={styles.photosSection}>
            <View style={styles.sectionHeader}>
              <Typography size={16} weight="600">
                Photos ({selectedPhotos.length}/5)
              </Typography>
              <Typography size={14} textType="secondary">
                Long press on photos to reorder
              </Typography>
            </View>

            {photoItems.length > 0 ? (
              <DraggableFlatList
                data={photoItems}
                onDragEnd={handleDragEnd}
                keyExtractor={(item) => item.id}
                renderItem={renderPhotoItem}
                horizontal={true}
                style={styles.photoRow}
                contentContainerStyle={styles.photoRowContent}
                showsHorizontalScrollIndicator={false}
                scrollEnabled={true}
                activationDistance={10}
                animationConfig={{
                  duration: 100,
                }}
              />
            ) : (
              <View style={styles.emptyState}>
                <RemixIcon name="image-line" size={48} color={Colors[theme].secondary} />
                <Typography size={16} weight="500" textType="secondary">
                  No photos selected
                </Typography>
              </View>
            )}
          </View>

          {/* Detail Navigation Options */}
          <View style={styles.detailsContainer}>
            {/* Description Option */}
            <TouchableOpacity
              style={[styles.detailOption]}
              onPress={() => navigateToDetailsPage("description")}
            >
              <Feather name="align-left" size={24} color={Colors[theme].text} />
              <View style={styles.detailTextContainer}>
                <Typography size={16} weight="500">
                  Add Description
                </Typography>
                <Typography
                  size={13}
                  weight="400"
                  textType="secondary"
                  numberOfLines={1}
                >
                  {postDetails.description
                    ? postDetails.description.substring(0, 30) +
                      (postDetails.description.length > 30 ? "..." : "")
                    : "Tell viewers about your photos"}
                </Typography>
              </View>
              <Feather
                name="chevron-right"
                size={24}
                color={Colors[theme].text}
              />
            </TouchableOpacity>

            {/* Tags Option */}
            <TouchableOpacity
              style={[
                styles.detailOption,
              ]}
              onPress={() => navigateToDetailsPage("tags")}
            >
              <Feather 
                name="tag" 
                size={24} 
                color={(postDetails.tags || []).length === 0 ? '#ff4444' : Colors[theme].text} 
              />
              <View style={styles.detailTextContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Typography size={16} weight="500">
                    Tags
                  </Typography>
                  <Typography 
                    size={12} 
                    weight="500" 
                    style={{ color: '#ff4444' }}
                  >
                    *
                  </Typography>
                </View>
                <Typography
                  size={13}
                  weight="400"
                  textType="secondary"
                  numberOfLines={1}
                  style={{
                    color: (postDetails.tags || []).length === 0 ? '#ff4444' : Colors[theme].secondary
                  }}
                >
                  {(postDetails.tags || []).length > 0
                    ? (postDetails.tags || []).join(", ")
                    : "Required: Add tags to help viewers find your photos"}
                </Typography>
              </View>
              <Feather
                name="chevron-right"
                size={24}
                color={(postDetails.tags || []).length === 0 ? '#ff4444' : Colors[theme].text}
              />
            </TouchableOpacity>

            {/* Visibility Option */}
            {/* <TouchableOpacity
              style={[styles.detailOption]}
              onPress={() => navigateToDetailsPage("visibility")}
            >
              <RemixIcon
                name={
                  postDetails.visibility === "public"
                    ? "earth-line"
                    : postDetails.visibility === "private"
                    ? "lock-line"
                    : "link"
                }
                size={24}
                color={Colors[theme].text}
              />
              <View style={styles.detailTextContainer}>
                <Typography size={16} weight="500">
                  Visibility
                </Typography>
                <Typography size={13} weight="400" textType="secondary">
                  {postDetails.visibility.charAt(0).toUpperCase() +
                    postDetails.visibility.slice(1)}
                </Typography>
              </View>
              <Feather
                name="chevron-right"
                size={24}
                color={Colors[theme].text}
              />
            </TouchableOpacity> */}

            {/* Comments Option */}
            <TouchableOpacity
              style={[styles.detailOption]}
              onPress={() => navigateToDetailsPage("comments")}
            >
              <RemixIcon
                name="chat-1-line"
                size={24}
                color={Colors[theme].text}
              />
              <View style={styles.detailTextContainer}>
                <Typography size={16} weight="500">
                  Comments
                </Typography>
                <Typography size={13} weight="400" textType="secondary">
                  {postDetails.isCommentsAllowed
                    ? "Comments allowed"
                    : "Comments disabled"}
                </Typography>
              </View>
              <Feather
                name="chevron-right"
                size={24}
                color={Colors[theme].text}
              />
            </TouchableOpacity>
          </View>

          {/* Extra bottom padding */}
          <View style={{ height: 100 }} />
        </ScrollView>

        <View
          style={[styles.footer, { backgroundColor: Colors[theme].background }]}
        >
          <TouchableOpacity
            style={[
              styles.uploadButton,
              { 
                backgroundColor: (isUploading || selectedPhotos.length === 0 || (postDetails.tags || []).length === 0) 
                  ? Colors[theme].secondary 
                  : Colors.general.primary 
              },
              isUploading && { opacity: 0.7 },
            ]}
            onPress={handleUpload}
            disabled={isUploading || selectedPhotos.length === 0 || (postDetails.tags || []).length === 0}
          >
            <Typography size={16} weight="600" style={{ color: "#FFFFFF" }}>
              {isUploading 
                ? "Starting Upload..." 
                : (postDetails.tags || []).length === 0 
                  ? "Add Tags to Upload" 
                  : `Upload Photos (${selectedPhotos.length})`}
            </Typography>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  draftButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  photosSection: {
    marginVertical: 16,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  photoRow: {
    height: 350,
  },
  photoRowContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  photoItem: {
    width: 250,
    height: 300,
    marginRight: 20,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    backgroundColor: '#fff',
  },
  activePhotoItem: {
    transform: [{ scale: 1.1 }],
    opacity: 0.95,
    elevation: 8,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 1000,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoNumber: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,0,0,0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  detailsContainer: {
    // marginVertical: 16,
  },
  detailOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 12,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  uploadButton: {
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});