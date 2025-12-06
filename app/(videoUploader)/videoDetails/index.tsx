import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Typography from "@/components/ui/Typography/Typography";
import RemixIcon from "react-native-remix-icon";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import useVideoUploadStore from "@/store/videoUploadStore";
import * as ImagePicker from "expo-image-picker";
import BackButton from "@/components/utilities/BackButton";
import { Feather } from "@expo/vector-icons";
import useUploadVideo from "@/hooks/upload/useUploadVideo";

export default function VideoDetailsScreen() {
  const router = useRouter();
  const { theme } = useCustomTheme();
  const { selectedVideo, editedVideoUri, uploadMode, selectedPhotos, closeDetailsScreen } = useVideoUploadStore();
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);

  const {
    handlePickThumbnail,
    handleUpload,
    isUploading,
    navigateToDetailsPage,
    thumbnailImage,
    videoDetails,
  } = useUploadVideo();

  // Get media URI for dimension detection
  const mediaUri = useMemo(() => {
    if (uploadMode === 'video') {
      return editedVideoUri || selectedVideo?.uri;
    } else if (uploadMode === 'photo' && selectedPhotos.length > 0) {
      return selectedPhotos[0].uri;
    }
    return null;
  }, [uploadMode, editedVideoUri, selectedVideo, selectedPhotos]);

  // Handle image load to get dimensions
  const handleImageLoad = (event: any) => {
    if (event?.nativeEvent?.source) {
      const { width, height } = event.nativeEvent.source;
      setVideoDimensions({ width, height });
    }
  };

  // Reset dimensions when content changes
  useEffect(() => {
    setVideoDimensions(null);
  }, [mediaUri]);

  // Handle back button - close details screen state so BackHandler in editor works
  const handleBackPress = () => {
    console.log('🔙 VideoDetails back button pressed - closing details screen');
    closeDetailsScreen();
    console.log('🔙 VideoDetails navigating back to editor with delay');
    // Small delay to ensure state update is processed before navigation
    setTimeout(() => {
      router.back();
    }, 50);
  };

  // Calculate dynamic thumbnail height based on actual video dimensions
  const thumbnailHeight = useMemo(() => {
    if (videoDimensions) {
      const screenWidth = Dimensions.get('window').width;
      const aspectRatio = videoDimensions.width / videoDimensions.height;
      const calculatedHeight = screenWidth / aspectRatio;
      
      // Apply constraints to prevent extremely tall or short thumbnails
      const maxHeight = screenWidth * 1.5; // 2:3 aspect ratio
      const minHeight = screenWidth * 0.5; // 2:1 aspect ratio
      
      return Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
    }
    
    // Fallback to 16:9 ratio when dimensions not yet loaded
    return Dimensions.get('window').width * (9 / 16);
  }, [videoDimensions]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
      edges={["top"]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <View style={styles.header}>
        <BackButton handlePress={handleBackPress} />
        <Typography size={18} weight="600">
          Add details
        </Typography>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Media Preview */}
        <View style={styles.thumbnailContainer}>
          {/* Hidden preloader to get video dimensions */}
          {mediaUri && videoDimensions === null && (
            <Image 
              source={{ uri: mediaUri }} 
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
              onLoad={handleImageLoad}
            />
          )}
          
          {/* Video thumbnail selector */}
          <TouchableOpacity
            style={[
              styles.thumbnailPreview,
              { 
                backgroundColor: Colors[theme].cardBackground,
                height: thumbnailHeight 
              },
            ]}
            onPress={handlePickThumbnail}
          >
            {thumbnailImage ? (
              <Image
                source={{ uri: thumbnailImage }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.thumbnailPlaceholder,
                  { backgroundColor: Colors[theme].cardBackground },
                ]}
              >
                <RemixIcon
                  name="image-add-line"
                  size={32}
                  color={Colors[theme].secondary}
                />
              </View>
            )}
            <View style={styles.thumbnailOverlay}>
              <RemixIcon name="edit-line" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Detail Navigation Options */}
        <View style={styles.detailsContainer}>
          {/* Description Option */}
          <TouchableOpacity
            style={[styles.detailOption]}
            onPress={() => navigateToDetailsPage("description")}
          >
            <TouchableOpacity>
              <Feather name="align-left" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
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
                {videoDetails.description
                  ? videoDetails.description.substring(0, 30) +
                    (videoDetails.description.length > 30 ? "..." : "")
                  : "Tell viewers about your video"}
              </Typography>
            </View>
            <TouchableOpacity>
              <Feather
                name="chevron-right"
                size={24}
                color={Colors[theme].text}
              />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Tags Option */}
          <TouchableOpacity
            style={[
              styles.detailOption,
            ]}
            onPress={() => navigateToDetailsPage("tags")}
          >
            <TouchableOpacity>
              <Feather 
                name="tag" 
                size={24} 
                color={videoDetails.tags.length === 0 ? '#ff4444' : Colors[theme].text} 
              />
            </TouchableOpacity>
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
                  color: videoDetails.tags.length === 0 ? '#ff4444' : Colors[theme].secondary
                }}
              >
                {videoDetails.tags.length > 0
                  ? videoDetails.tags.join(", ")
                  : "Required: Add tags to help viewers find your video"}
              </Typography>
            </View>
            <TouchableOpacity>
              <Feather
                name="chevron-right"
                size={24}
                color={videoDetails.tags.length === 0 ? '#ff4444' : Colors[theme].text}
              />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Visibility Option */}
          {/* <TouchableOpacity
            style={[styles.detailOption]}
            onPress={() => navigateToDetailsPage("visibility")}
          >
            <RemixIcon
              name={
                videoDetails.visibility === "public"
                  ? "earth-line"
                  : videoDetails.visibility === "private"
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
                {videoDetails.visibility.charAt(0).toUpperCase() +
                  videoDetails.visibility.slice(1)}
              </Typography>
            </View>
            <TouchableOpacity>
              <Feather
                name="chevron-right"
                size={24}
                color={Colors[theme].text}
              />
            </TouchableOpacity>
          </TouchableOpacity> */}

          {/* Add to Playlist Option */}
          <TouchableOpacity
            style={[styles.detailOption]}
            onPress={() => navigateToDetailsPage("playlist")}
          >
            <RemixIcon
              name="play-list-add-line"
              size={24}
              color={Colors[theme].text}
            />
            <View style={styles.detailTextContainer}>
              <Typography size={16} weight="500">
                Add to playlist
              </Typography>
              <Typography size={13} weight="400" textType="secondary">
                {videoDetails.playlistIds.length > 0
                  ? "Added to playlist"
                  : "Choose a playlist"}
              </Typography>
            </View>
            <TouchableOpacity>
              <Feather name="plus" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
          </TouchableOpacity>

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
                {videoDetails.isCommentsAllowed
                  ? "Comments allowed"
                  : "Comments disabled"}
              </Typography>
            </View>
            <TouchableOpacity>
              <Feather
                name="chevron-right"
                size={24}
                color={Colors[theme].text}
              />
            </TouchableOpacity>
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
              backgroundColor: (isUploading || videoDetails.tags.length === 0) 
                ? Colors[theme].secondary 
                : Colors.general.primary 
            },
            isUploading && { opacity: 0.7 },
          ]}
          onPress={handleUpload}
          disabled={isUploading || videoDetails.tags.length === 0}
        >
          <Typography size={16} weight="600" style={{ color: "#FFFFFF" }}>
            {isUploading 
              ? "Starting Upload..." 
              : videoDetails.tags.length === 0 
                ? "Add Tags to Upload" 
                : "Upload Video"}
          </Typography>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  thumbnailContainer: {
    // marginVertical: 16,
  },
  thumbnailPreview: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailOverlay: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsContainer: {
    marginVertical: 16,
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