import React from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Typography from "@/components/ui/Typography/Typography";
import RemixIcon from "react-native-remix-icon";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import BackButton from "@/components/utilities/BackButton";
import { Feather } from "@expo/vector-icons";
import useEditPost from "@/hooks/feeds/useEditPost";
import useGetPost from "@/hooks/feeds/useGetPost";
import Spinner from "react-native-loading-spinner-overlay";
import CustomModal from "@/components/shared/CustomModal";
// import SuccessLottie from "@/components/shared/SuccessLottie";
import AppButton from "@/components/ui/AppButton";

const EditPost = () => {
  const { theme } = useCustomTheme();


  const { item: postId } = useLocalSearchParams();
  const { data: post, isSuccess, isPending } = useGetPost(postId as string);
    const {
    handlePickThumbnail,
    handleUpload,
    isUploading,
    navigateToDetailsPage,
    thumbnailImage,
    uploadProgress,
    videoDetails,
    videoUri,
    router,
    showModalSuccess,
    setShowModalSuccess
  } = useEditPost(postId as string);

  console.log("videoUri", videoUri);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
      edges={["top"]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

      <CustomModal
        // showModalSuccess
        visible={showModalSuccess}
        width={"60%"}
      >
        <View>
          {/* <SuccessLottie /> */}

          <Typography align="center" size={20} weight="800" style={{ marginBottom: 10 }}>Done</Typography>

          <AppButton 
            title="Back To Feed" 
            handlePress={() => {
              router.push("/(tabs)")
              setShowModalSuccess(false);
            }} />
        </View>
      </CustomModal>

      <View style={styles.header}>
        <BackButton />
        <Typography size={18} weight="600">
          Edit details
        </Typography>
      </View>

      <View>
        <Spinner visible={isPending} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Thumbnail Selector */}
        <View style={styles.thumbnailContainer}>
          <TouchableOpacity
            style={[
              styles.thumbnailPreview,
              { backgroundColor: Colors[theme].cardBackground },
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
              <ImageBackground
                source={{ uri: post?.data.thumbnail }}
                style={{ height: "100%", width: "100%"  }}
                resizeMode="cover"
              >
                {/* <RemixIcon
                  name="image-add-line"
                  size={32}
                  color={Colors[theme].secondary}
                /> */}
              </ImageBackground>
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
            onPress={() => router.push({
              pathname: "/editDetails/editDescription",
              params: {
                description: post?.data?.description
              }
            })}
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
            style={[styles.detailOption]}
            onPress={() => router.push({
              pathname: "/editDetails/editTags",
              params: {
                tags: Array.isArray(post?.data?.tags) ? post?.data?.tags.join(',') : post?.data?.tags
              }
            })}
          >
            <TouchableOpacity>
              <Feather name="tag" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
            <View style={styles.detailTextContainer}>
              <Typography size={16} weight="500">
                Tags
              </Typography>
              <Typography
                size={13}
                weight="400"
                textType="secondary"
                numberOfLines={1}
              >
                {/* {videoDetails.tags.length > 0
                  ? videoDetails.tags.join(", ")
                  : "Add tags to help viewers find your video"} */}
                  {post?.data.tags.length > 0
                  ? post?.data.tags.join(", ")
                  : "Add tags to help viewers find your video"}
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

          {/* Visibility Option */}
          <TouchableOpacity
            style={[styles.detailOption]}
            onPress={() => {
              router.push({
                pathname: "/editDetails/editVisibility",
                params: {
                  visibility: post?.data.visibility
                }
              })
            }}
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
        {/* Upload Progress Indicator */}
        
        {/* {isUploading && (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${uploadProgress.progress}%`,
                  backgroundColor: Colors.general.primary,
                },
              ]}
            />
            <Typography size={14} weight="400" textType="secondary">
              Uploading... {uploadProgress.progress}%
            </Typography>
          </View>
        )} */}

        <TouchableOpacity
          style={[
            styles.uploadButton,
            { backgroundColor: Colors.general.primary },
            isUploading && { opacity: 0.7 },
          ]}
          onPress={handleUpload}
          disabled={isUploading}
        >
          <Typography size={16} weight="600" style={{ color: "#FFFFFF" }}>
            {isUploading ? "Updating..." : "Update Details"}
          </Typography>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

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
    marginVertical: 16,
  },
  thumbnailPreview: {
    width: "100%",
    height: 219,
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
  progressContainer: {
    marginBottom: 10,
    height: 20,
    paddingLeft: 10,
    backgroundColor: "#EFEFEF",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
  },
  uploadButton: {
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default EditPost;
