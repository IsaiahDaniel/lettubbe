import React, { useState, useCallback } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import Wrapper from "@/components/utilities/Wrapper2";
import Typography from "@/components/ui/Typography/Typography";
import LiveChannelsSection from "@/components/shared/streaming/LiveChannelsSection";
import PopularCategoriesSection from "@/components/shared/streaming/PopularCategoriesSection";
import PopularStreamersSection from "@/components/shared/streaming/PopularStreamersSection";
import UpcomingStreamsSection from "@/components/shared/streaming/UpcomingStreamsSection";
import LiveStreamsSection from "@/components/shared/streaming/LiveStreamsSection";
import ShareStreamModal from "@/components/shared/streaming/ShareStreamModal";
import { useStreamingActions } from "@/hooks/streaming/useStreamingActions";
import { UpcomingStream } from "@/helpers/types/streaming/streaming.types";
import useGetAllStreams from "@/hooks/streaming/useGetAllStreams";
import { useGetRecommendedStreams, useGetPopularStreamers } from "@/hooks/streaming/useGetPopularStreams";
import useGetStreamingCategories from "@/hooks/streaming/useGetStreamingCategories";
import useGetUpcomingStreams from "@/hooks/streaming/useGetUpcomingStreams";
import useGetLiveStreams from "@/hooks/streaming/useGetLiveStreams";

const StreamingScreen = () => {
  const { theme } = useCustomTheme();
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedStream, setSelectedStream] = useState<UpcomingStream | null>(null);
  const {
    handleStreamPress,
    handleCategoryPress,
    handleStreamerPress,
    handleViewAllStreams,
    handleViewAllCategories,
    handleViewAllStreamers,
    handleUpcomingStreamPress,
    handleViewAllUpcomingStreams,
    handleAvatarPress,
  } = useStreamingActions();

  const handleSharePress = (stream: UpcomingStream) => {
    setSelectedStream(stream);
    setShowShareModal(true);
  };

  // API data hooks
  const { streams, isPending: streamsLoading, refetch: refetchStreams } = useGetAllStreams();
  const { streams: recommendedStreams, isPending: recommendedLoading, refetch: refetchRecommended } = useGetRecommendedStreams();
  const { streamers, isPending: streamersLoading, refetch: refetchStreamers } = useGetPopularStreamers();
  const { categories, isPending: categoriesLoading, refetch: refetchCategories } = useGetStreamingCategories();
  const { streams: upcomingStreams, isPending: upcomingLoading, refetch: refetchUpcoming } = useGetUpcomingStreams();
  const { liveStreams, isPending: liveStreamsLoading, refetch: refetchLiveStreams } = useGetLiveStreams();

  // Debug logging for streaming screen
  console.log('🔍 StreamingScreen - upcomingStreams:', JSON.stringify(upcomingStreams, null, 2));
  console.log('🔍 StreamingScreen - upcomingLoading:', upcomingLoading);
  console.log('🔍 StreamingScreen - upcomingStreams count:', upcomingStreams?.length || 0);

  const isRefreshing = streamsLoading || recommendedLoading || streamersLoading || categoriesLoading || upcomingLoading || liveStreamsLoading;

  const handleRefresh = useCallback(() => {
    console.log('🔄 Refreshing all streaming data...');
    refetchStreams();
    refetchRecommended();
    refetchStreamers();
    refetchCategories();
    refetchUpcoming();
    refetchLiveStreams();
  }, [refetchStreams, refetchRecommended, refetchStreamers, refetchCategories, refetchUpcoming, refetchLiveStreams]);

  // Automatically refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 StreamingScreen focused - refreshing data...');
      handleRefresh();
    }, [handleRefresh])
  );

  const handleBackPress = () => {
    router.back();
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setSelectedStream(null);
  };


  return (
    <Wrapper>
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <View style={[styles.header, { borderBottomColor: Colors[theme].borderColor }]}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={Colors[theme].textBold}
            />
          </TouchableOpacity>
          <Typography textType="carter" size={20} weight="600">
            Lettubbe Live
          </Typography>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.general.primary]}
              tintColor={Colors.general.primary}
            />
          }
        >
          {/* <LiveChannelsSection
            streams={streams}
            onStreamPress={handleStreamPress}
            onViewAllPress={handleViewAllStreams}
            onRefresh={handleRefresh}
          /> */}

          {upcomingStreams && upcomingStreams.length > 0 && (
            <UpcomingStreamsSection
              streams={upcomingStreams}
              onStreamPress={handleUpcomingStreamPress}
              onViewAllPress={handleViewAllUpcomingStreams}
              onRefresh={handleRefresh}
            />
          )}
          
          {categories && categories.length > 0 && (
            <PopularCategoriesSection
              categories={categories}
              onCategoryPress={handleCategoryPress}
              onViewAllPress={handleViewAllCategories}
              onRefresh={handleRefresh}
            />
          )}

          <LiveStreamsSection
            onStreamPress={handleUpcomingStreamPress}
            onAvatarPress={handleAvatarPress}
            onSharePress={handleSharePress}
          />
          
          {/* {streamers && streamers.length > 0 && (
            <PopularStreamersSection
              streamers={streamers}
              onStreamerPress={handleStreamerPress}
              onViewAllPress={handleViewAllStreamers}
              onRefresh={handleRefresh}
            />
          )} */}
        </ScrollView>

        {selectedStream && (
          <ShareStreamModal
            isVisible={showShareModal}
            onClose={handleCloseShareModal}
            streamData={selectedStream}
          />
        )}
      </View>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
});

export default StreamingScreen;