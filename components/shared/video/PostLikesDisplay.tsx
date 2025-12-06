import React, { useState, useCallback, memo } from "react";
import { View, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import Typography from "@/components/ui/Typography/Typography";
import CustomBottomSheet from "@/components/ui/CustomBottomSheet";
import Avatar from "@/components/ui/Avatar";
import { usePostLikes } from "@/hooks/feeds/usePostLikes";
import { PostLike } from "@/helpers/types/feed/feed.types";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import { formatNumber } from "@/helpers/utils/formatting";

interface PostLikesDisplayProps {
  postId: string;
  likeCount: number;
  onAvatarPress?: (userId: string) => void;
}

interface LikeItemProps {
  item: PostLike;
  onAvatarPress?: (userId: string) => void;
}

const LikeItem = memo(({ item, onAvatarPress }: LikeItemProps) => {
  const { theme } = useCustomTheme();
  
  const handlePress = useCallback(() => {
    onAvatarPress?.(item._id);
  }, [item._id, onAvatarPress]);

  const fullName = `${item.firstName} ${item.lastName}`.trim();

  return (
    <TouchableOpacity 
      style={styles.likeItem} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Avatar
        imageSource={item.profilePicture}
        uri={true}
        size={40}
        showRing={true}
        ringColor={Colors[theme].avatar}
        ringThickness={1.2}
        gapSize={2}
        alt={`${fullName || item.username} profile picture`}
      />
      <View style={styles.userInfo}>
        <Typography 
          weight="600" 
          size={16} 
          lineHeight={20}
          textType="textBold"
        >
          {fullName || item.username}
        </Typography>
        <Typography 
          weight="400" 
          size={14} 
          lineHeight={18}
          textType="secondary"
        >
          @{item.username}
        </Typography>
      </View>
    </TouchableOpacity>
  );
});

export const PostLikesDisplay = memo(({ 
  postId, 
  likeCount, 
  onAvatarPress 
}: PostLikesDisplayProps) => {
  const { theme } = useCustomTheme();
  const [showLikesSheet, setShowLikesSheet] = useState(false);
  
  // Fetch likes data immediately to show proper preview text
  const { data: likesData, isLoading, error } = usePostLikes(postId, likeCount > 0);
  
  // debug
  // console.log('PostLikesDisplay:', {
  //   postId,
  //   likeCount,
  //   showLikesSheet,
  //   isLoading,
  //   likesCount: likesData?.data?.likes?.length || 0
  // });
  
  const handleLikesPress = useCallback(() => {
    console.log('Likes pressed, likeCount:', likeCount);
    if (likeCount > 0) {
      setShowLikesSheet(true);
    }
  }, [likeCount]);

  const handleCloseLikesSheet = useCallback(() => {
    console.log('Closing likes sheet');
    setShowLikesSheet(false);
  }, []);

  const renderLikeItem = useCallback(({ item }: { item: PostLike }) => (
    <LikeItem item={item} onAvatarPress={onAvatarPress} />
  ), [onAvatarPress]);

  const keyExtractor = useCallback((item: PostLike) => item._id, []);

  //first username for display
  const firstUsername = likesData?.data?.likes?.[0]?.username || "someone";
  const remainingLikes = likeCount - 1;

  const getLikesText = () => {
    if (likeCount === 1) {
      return `Liked by ${firstUsername}`;
    } else if (likeCount === 2) {
      const secondUsername = likesData?.data?.likes?.[1]?.username;
      return `Liked by ${firstUsername}${secondUsername ? ` and ${secondUsername}` : ' and 1 other'}`;
    } else {
      return `Liked by ${firstUsername} and ${formatNumber(remainingLikes)} others`;
    }
  };

  // Don't render if no likes
  if (likeCount === 0) {
    // console.log('Not rendering - no likes');
    return null;
  }

  return (
    <>
      <TouchableOpacity 
        onPress={handleLikesPress} 
        activeOpacity={0.7}
        style={styles.likesTextContainer}
      >
        <Typography 
          weight="500" 
          size={13} 
          lineHeight={18}
          textType="secondary"
        >
          {getLikesText()}
        </Typography>
      </TouchableOpacity>

      <CustomBottomSheet
        isVisible={showLikesSheet}
        onClose={handleCloseLikesSheet}
        title="Likes"
        sheetheight={500}
      >
        <View style={styles.likesContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Typography 
                weight="400" 
                size={16} 
                textType="secondary"
              >
                Loading likes...
              </Typography>
            </View>
          ) : error ? (
            <View style={styles.loadingContainer}>
              <Typography 
                weight="400" 
                size={16} 
                textType="secondary"
              >
                Error loading likes: {error.message}
              </Typography>
            </View>
          ) : !likesData?.data?.likes || likesData.data.likes.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Typography 
                weight="400" 
                size={16} 
                textType="secondary"
              >
                No likes found
              </Typography>
            </View>
          ) : (
            <FlatList
              data={likesData.data.likes}
              renderItem={renderLikeItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </CustomBottomSheet>
    </>
  );
});

const styles = StyleSheet.create({
  likesTextContainer: {
    // marginBottom: 4,
  },
  likesContainer: {
    flex: 1,
    paddingHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(142, 155, 174, 0.1)',
    marginHorizontal: 52,
  },
});

export default PostLikesDisplay;