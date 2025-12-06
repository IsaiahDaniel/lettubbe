import React, { useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  ImageBackground,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Icons, Images } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import AppButton from "@/components/ui/AppButton";
import BackButton from "@/components/utilities/BackButton";
import PlaylistCard from "@/components/shared/profile/PlaylistCard";
import ScrollBottomSpace from "@/components/utilities/ScrollBottomSpace";
import Wrapper from "@/components/utilities/Wrapper";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import useSinglePlaylist from "@/hooks/profile/useSinglePlaylist";
import useGetPlaylistVideos from "@/hooks/profile/useGetPlaylistVideos";
import Avatar from "@/components/ui/Avatar";
import { useGetVideoItemStore } from "@/store/feedStore";
import { usePlaylistStore } from "@/store/playlistStore";
import EmptyState from "@/components/shared/chat/EmptyState";

const ViewPlaylist = () => {
  const { theme } = useCustomTheme();
  const { id } = useLocalSearchParams();
  
  // logging for ViewPlaylist component
  const invalidIds = ['video', 'photo', 'community', 'streaming', ''];
  const isInvalidId = id && invalidIds.includes(id as string);
  
  if (isInvalidId) {
    console.error('🚨 VIEW PLAYLIST DEBUG: Invalid ID from useLocalSearchParams!', {
      id,
      typeof_id: typeof id,
      invalidIds,
      allParams: useLocalSearchParams(),
      stackTrace: new Error().stack
    });
  }
  
  console.log('🎵 VIEW PLAYLIST DEBUG: ViewPlaylist component rendered with:', {
    id,
    typeof_id: typeof id,
    isInvalid: isInvalidId,
    allParams: useLocalSearchParams()
  });

  const { setSelectedItem } = useGetVideoItemStore();
  const { setPlaylist } = usePlaylistStore(); // Get playlist store actions

  const { playlistData, refetchPlaylist } = useSinglePlaylist(id as string);
  const { playlistVideos, videosLoading, refetchVideos } = useGetPlaylistVideos(id as string);

  // Refresh playlist data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Refetch playlist videos when returning from AddPlaylistVideo screen
      refetchVideos();
      refetchPlaylist();
    }, [refetchVideos, refetchPlaylist])
  );

  // Function to handle video selection and navigation
  const handleVideoPress = (videoItem: any, videoIndex?: number) => {
    // Set the selected video in the global store
    setSelectedItem(videoItem);

    // If we have playlist videos, set up the playlist context
    if (playlistVideos?.data && Array.isArray(playlistVideos.data)) {
      const startIndex =
        videoIndex !== undefined
          ? videoIndex
          : playlistVideos.data.findIndex((v) => v._id === videoItem._id);

      setPlaylist(playlistVideos.data, Math.max(0, startIndex), id as string);
    }

    router.push("/(home)/VideoPlayer");
  };

  // Function to play all videos
  const handlePlayAll = () => {
    if (
      playlistVideos?.data &&
      Array.isArray(playlistVideos.data) &&
      playlistVideos.data.length > 0
    ) {
      const firstVideo = playlistVideos.data[0];

      // Enable auto-play when setting up playlist
      setPlaylist(playlistVideos.data, 0, id as string, true);
      setSelectedItem(firstVideo);
      router.push("/(home)/VideoPlayer");
    }
  };

  return (
    <Wrapper noPadding>
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
          <BackButton />
          <Typography weight="700" size={18} textType="carter">
            {playlistData?.data?.name}
          </Typography>
        </View>
        <Ionicons
          name="share-outline"
          size={24}
          color={Colors[theme].textBold}
        />
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <ImageBackground
          source={{ uri: playlistData?.data?.coverPhoto }}
          style={styles.backgroundImage}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginHorizontal: 15,
            marginTop: 16,
          }}
        >
          <Avatar
            imageSource={playlistData?.data?.user?.profilePicture}
            uri={true}
            size={40}
            showRing={true}
            ringColor={Colors[theme].avatar}
          />
          <Typography weight="600" size={16} textType="textBold">
            {playlistData?.data?.user?.firstName}{" "}
            {playlistData?.data?.user?.lastName}
          </Typography>
        </View>
        
        <View
          style={{
            paddingHorizontal: 15,
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View
              style={{
                width: 6,
                height: 6,
                backgroundColor: "#6E6E6E",
                borderRadius: 3,
              }}
            />
            <Typography> {playlistData?.data?.videos?.length} videos</Typography>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <AppButton
              variant="compact"
              title="Play all"
              handlePress={handlePlayAll}
              disabled={!playlistVideos?.data?.length || videosLoading}
            />
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(profile)/CreatePlaylist",
                  params: {
                    playlistDetails: playlistData?.data,
                    playlistId: id as string,
                  },
                })
              }
            >
              <Image
                source={Icons.pencil}
                style={{ width: 24, height: 24 }}
                tintColor={Colors[theme].textBold}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(profile)/AddPlaylistVideo",
                  params: { id: id },
                })
              }
            >
              <Image
                source={Icons.plus}
                style={{ width: 24, height: 24 }}
                tintColor={Colors[theme].textBold}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio */}
        <View
          style={[
            styles.bioContainer,
            { backgroundColor: Colors[theme].cardBackground },
          ]}
        >
          <Typography style={styles.bioText}>
            {playlistData?.data?.description}
          </Typography>
        </View>
        
        {/* Playlist Videos */}
        {playlistVideos?.data?.length > 0 ? (
          <View style={{ padding: 15, gap: 10 }}>
            {playlistVideos?.data?.map((item: any, index: number) => (
              <PlaylistCard
                key={item._id}
                item={item}
                isPlaylist={false}
                onPress={() => handleVideoPress(item, index)}
                playlistId={id as string}
                showRemoveOption={true}
                onRemoveSuccess={() => {
                  // Refresh the playlist videos after successful removal
                  refetchVideos();
                  refetchPlaylist();
                }}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              title="Your playlist is empty"
              subtitle="Add some videos to get started. Tap the + button above to search and add videos."
              image={require("@/assets/images/EmptyPlaylist.png")}
              customStyle={styles.emptyState}
            />
            <AppButton
              title="Add Videos"
              handlePress={() =>
                router.push({
                  pathname: "/(profile)/AddPlaylistVideo",
                  params: { id: id },
                })
              }
              style={styles.addVideosButton}
              variant="primary"
            />
          </View>
        )}
        
        <ScrollBottomSpace />
      </ScrollView>
    </Wrapper>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COVER_HEIGHT = SCREEN_WIDTH * (9 / 16); // 16:9 aspect ratio

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 6,
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  backgroundImage: {
    width: "100%",
    height: COVER_HEIGHT,
  },

  bioContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginVertical: 16,
    marginHorizontal: 15,
    borderRadius: 10,
  },
  bioText: {
    marginBottom: 10,
  },
  externalLink: {
    color: "#0390C1",
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 40,
    minHeight: 300,
  },
  emptyState: {
    flex: 0,
    paddingVertical: 20,
  },
  addVideosButton: {
    marginTop: 20,
    alignSelf: 'center',
    width: '80%',
  },
});

export default ViewPlaylist;
