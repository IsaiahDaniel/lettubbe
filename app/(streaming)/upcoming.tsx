import React, { useCallback } from "react";
import { View, TouchableOpacity, FlatList, StyleSheet, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import Wrapper from "@/components/utilities/Wrapper2";
import Typography from "@/components/ui/Typography/Typography";
import StreamVideoCard from "@/components/shared/streaming/StreamVideoCard";
import { UpcomingStream } from "@/helpers/types/streaming/streaming.types";
import useGetUpcomingStreams from "@/hooks/streaming/useGetUpcomingStreams";
import { useStreamingActions } from "@/hooks/streaming/useStreamingActions";
import UserProfileBottomSheet from "@/components/ui/Modals/UserProfileBottomSheet";
import ShareStreamModal from "@/components/shared/streaming/ShareStreamModal";

const UpcomingStreamsScreen = () => {
  const { theme } = useCustomTheme();
  const { handleUpcomingStreamPress } = useStreamingActions();
  const { streams: upcomingStreams, isPending: loading, refetch } = useGetUpcomingStreams();
  const [showUserProfile, setShowUserProfile] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<string | undefined>();
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [selectedStream, setSelectedStream] = React.useState<UpcomingStream | null>(null);
  
  const handleBackPress = () => {
    router.back();
  };

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleAvatarPress = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setShowUserProfile(true);
  }, []);

  const handleCloseUserProfile = useCallback(() => {
    setShowUserProfile(false);
    setSelectedUserId(undefined);
  }, []);

  const handleSharePress = useCallback((stream: UpcomingStream) => {
    setSelectedStream(stream);
    setShowShareModal(true);
  }, []);

  const handleCloseShareModal = useCallback(() => {
    setShowShareModal(false);
    setSelectedStream(null);
  }, []);

  const renderUpcomingStream = ({ item }: { item: UpcomingStream }) => (
    <StreamVideoCard 
      stream={item} 
      onPress={handleUpcomingStreamPress}
      onAvatarPress={handleAvatarPress}
      onSharePress={handleSharePress}
    />
  );

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
          <Typography size={18} weight="600">
            Upcoming Streams
          </Typography>
        </View>

        <FlatList
          data={upcomingStreams}
          renderItem={renderUpcomingStream}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              colors={[Colors.general.primary]}
              tintColor={Colors.general.primary}
            />
          }
        />

        <UserProfileBottomSheet
          isVisible={showUserProfile}
          onClose={handleCloseUserProfile}
          userId={selectedUserId}
        />

        {showShareModal && selectedStream && (
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
  listContent: {
    // padding: 16,
  },
});

export default UpcomingStreamsScreen;