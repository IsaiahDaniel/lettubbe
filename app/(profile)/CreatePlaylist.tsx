import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Wrapper from "@/components/utilities/Wrapper";
import TopHeader from "@/components/ui/TopHeader";
import Typography from "@/components/ui/Typography/Typography";
import Input from "@/components/ui/inputs/Input";
import { useForm, Controller } from "react-hook-form";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors, Icons, Images } from "@/constants";
import AppButton from "@/components/ui/AppButton";
import { router, useLocalSearchParams } from "expo-router";
import showToast from "@/helpers/utils/showToast";
import axios from "axios";
import { baseURL } from "@/config/axiosInstance";
import useAuth from "@/hooks/auth/useAuth";
import { handleError } from "@/helpers/utils/handleError";
import useSinglePlaylist from "@/hooks/profile/useSinglePlaylist";
import AppMenu from "@/components/ui/AppMenu";
import { useAlert } from "@/components/ui/AlertProvider";
import { useQueryClient } from "@tanstack/react-query";

export default function CreatePlaylist() {
  const { theme } = useCustomTheme();
  const {
    playlistId,
    returnTo,
    videoId,
    source, // to identify where the user came from
  } = useLocalSearchParams();

  const [playlistImage, setPlaylistImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const { token } = useAuth();
  const [isImageChanged, setIsImageChanged] = useState(false);
  const { showError } = useAlert();
  const queryClient = useQueryClient();

  const { playlistData, playlistLoading, refetchPlaylist } = useSinglePlaylist(
    playlistId as string
  );

  const coverPic = playlistImage?.uri
    ? { uri: playlistImage.uri }
    : playlistData?.data?.coverPhoto
    ? { uri: playlistData.data.coverPhoto }
    : Images.background;

  // Setup react-hook-form with empty defaults initially
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      playlistName: "",
      description: "",
      visibility: "private",
    },
  });

  // Watch visibility to use it in the UI
  const visibility = watch("visibility");

  useEffect(() => {
    refetchPlaylist();
  }, []);

  // Update form with playlist data once available
  useEffect(() => {
    if (playlistData?.data && !formInitialized) {
      // Prepare form data from playlist data
      const formData = {
        playlistName: playlistData.data.name || "",
        description: playlistData.data.description || "",
        visibility: playlistData.data.visibility || "private",
      };

      // Set the image separately
      if (playlistData.data.coverPhoto) {
        setPlaylistImage(playlistData.data.coverPhoto);
      }

      // Reset the form with new data
      reset(formData);
      setFormInitialized(true);
    }
  }, [playlistData, reset, formInitialized]);

  const borderColor = theme === "dark" ? "#1B2537" : "#E2E8F0";
  const backgroundColor = theme === "dark" ? "#1A1F2B" : "#F2F2F7";

  useEffect(() => {
    (async () => {
      // Request media library permissions
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          showError(
            "Permission required",
            "Please allow access to your photo library to upload a profile photo."
          );
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      // Launch image gallery
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPlaylistImage(result.assets[0]);
        setIsImageChanged(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const createPlaylist = async (apiFormData: any) => {
    try {
      setIsUploading(true);
      const { data } = await axios.post(`${baseURL}/playlist`, apiFormData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setIsUploading(false);

      if (data) {
        // Invalidate playlist queries to ensure profile refreshes when user goes back
        queryClient.invalidateQueries({ queryKey: ['playlist'] });
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        
        refetchPlaylist();
        showToast("success", "Playlist created successfully");

        // Handle different navigation flows based on where the user came from
        if (returnTo && videoId) {
          // Coming from SaveToPlaylistScreen - go back with new playlist data
          router.replace({
            pathname: returnTo as any,
            params: {
              videoId,
              newPlaylistId: data.data._id,
              refresh: "true",
              source, // Pass the original source through
            },
          });
        } else {
          // Always navigate to the newly created playlist
          router.replace({
            pathname: "/(profile)/ViewPlaylist" as any,
            params: {
              id: data.data._id,
            },
          });
        }
      }
    } catch (error) {
      setIsUploading(false);
      handleError(error);
    }
  };

  const updatePlaylist = async (playlistId: string, apiFormData: any) => {
    try {
      setIsUploading(true);
      const { data } = await axios.patch(
        `${baseURL}/playlist/${playlistId}`,
        apiFormData,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsUploading(false);

      if (data) {
        // Invalidate playlist queries to refresh profile when user goes back
        queryClient.invalidateQueries({ queryKey: ['playlist'] });
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
        queryClient.invalidateQueries({ queryKey: ['playlistVideos', playlistId] });
        
        refetchPlaylist();
        showToast("success", "Playlist updated successfully");
        router.back();
      }
    } catch (error) {
      setIsUploading(false);
      handleError(error);
    }
  };

  const onSubmit = async (formData: any) => {
    if (!playlistImage && !playlistData?.data?.coverPhoto) {
      showToast("error", "Please upload a playlist image");
      return;
    }

    const apiFormData = new FormData();

    // Only include the image if it's a new playlist OR the image has been changed
    if (playlistImage?.uri && !playlistImage.uri.startsWith("http")) {
      const imageData = {
        name: playlistImage.fileName
          ? playlistImage.fileName.split(".")[0]
          : "unknown",
        uri: playlistImage.uri,
        type: playlistImage.mimeType || "image/jpeg",
        size: playlistImage.fileSize,
      };
      apiFormData.append("playlistCoverPhoto", imageData as any);
    }

    apiFormData.append("name", formData.playlistName);
    apiFormData.append("description", formData.description);
    apiFormData.append("visibility", formData.visibility);

    if (playlistId) {
      await updatePlaylist(playlistId as string, apiFormData);
    } else {
      await createPlaylist(apiFormData);
    }
  };

  if (playlistId && playlistLoading) {
    return (
      <Wrapper>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Typography>Loading playlist data...</Typography>
        </View>
      </Wrapper>
    );
  }

  return (
    <Wrapper noPadding>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
      >
        <View style={{ paddingHorizontal: 16 }}>
          <TopHeader
            title={playlistId ? "Edit playlist" : "Create new playlist"}
          />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Upload Section */}
          <TouchableOpacity
            style={[styles.imageUpload, { backgroundColor }]}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {playlistImage ? (
              <>
                <Image source={coverPic} style={styles.selectedImage} />
                <View
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 12,
                    backgroundColor: "#F2F2F7",
                    padding: 5,
                    borderRadius: 100,
                  }}
                >
                  <Image
                    source={Icons.pencil}
                    style={{ width: 24, height: 24 }}
                  />
                </View>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={32}
                  color={Colors[theme].textBold}
                />
              </View>
            )}
          </TouchableOpacity>

          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            {/* Form */}
            <View style={styles.formSection}>
              <Typography weight="600" textType="textBold">
                Give your playlist a name
              </Typography>
              <Input
                control={control}
                name="playlistName"
                placeholder="Enter playlist name"
                rules={{ required: "Playlist name is required" }}
              />
              {errors.playlistName && (
                <Typography style={{ color: "red" }}>
                  {errors.playlistName.message}
                </Typography>
              )}
            </View>

            <View style={styles.formSection}>
              <Typography weight="600" textType="textBold">
                Add a short description
              </Typography>
              <Input
                control={control}
                name="description"
                placeholder="Enter description"
                multiline
              />
            </View>

            <View style={styles.formSection}>
              <Typography weight="600" textType="textBold">
                Visibility
              </Typography>

              <Controller
                control={control}
                name="visibility"
                render={({ field: { onChange, value } }) => (
                  <AppMenu
                    width={"50%"}
                    trigger={(isOpen) => (
                      <View
                        style={[
                          styles.dropdownButton,
                          {
                            borderColor,
                            backgroundColor: Colors[theme].inputBackground,
                          },
                        ]}
                      >
                        <View style={styles.visibilityRow}>
                          <Ionicons
                            name={value === "private" ? "lock-closed" : "globe"}
                            size={18}
                            color="#999"
                          />
                          <Typography>{value}</Typography>
                        </View>
                        <Ionicons name="chevron-down" size={22} color="black" />
                      </View>
                    )}
                    options={[{ name: "private" }, { name: "public" }]}
                    selectedOption={value}
                    onSelect={(option) => onChange(option)}
                  />
                )}
              />
            </View>

            {/* extra padding */}
            <View style={{ height: 120 }} />
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <AppButton
            variant="secondary"
            title="Cancel"
            handlePress={() => router.back()}
            style={{ flex: 1 }}
          />
          <AppButton
            title={playlistId ? "Update" : "Create"}
            handlePress={handleSubmit(onSubmit)}
            style={{ flex: 1 }}
            isLoading={isUploading}
          />
        </View>
      </KeyboardAvoidingView>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  imageUpload: {
    alignSelf: "center",
    width: "100%",
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  formSection: {
    marginBottom: 24,
    gap: 12,
  },

  dropdownButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    gap: 16,
    backgroundColor: "transparent",
  },
});