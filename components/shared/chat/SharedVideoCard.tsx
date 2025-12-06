import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Avatar from '@/components/ui/Avatar';
import { useRouter } from 'expo-router';
import { formatVideoDuration } from '@/helpers/utils/formatting';
import { useGetVideoItemStore, VideoItem } from '@/store/feedStore';
import useGetPost from '@/hooks/feeds/useGetPost';
import useAuth from '@/hooks/auth/useAuth';
import useGetPublicProfile from '@/hooks/profile/useGetPublicProfile';
import MessageAvatar from './MessageAvatar';
import MessageTimestamp from './renderers/MessageTimestamp';

interface SharedVideoCardProps {
  videoData: any; // Allow any data, i'll normalize it
  messageSender?: any; // The user who sent the message (might be different from video creator)
  item?: any;
  formattedTime?: string;
  shouldShowTimestamp?: boolean;
  onUserPress?: (userId: string) => void;
  useOwnPositioning?: boolean; //  control positioning
  isCurrentUser?: boolean;
}

// Function to normalize incomplete video data to VideoItem format
const normalizeVideoData = (data: any): VideoItem => {
  // Ensure we have a user object even if data.user is null/undefined
  const userObj = data.user || {};
  
  return {
    _id: data._id || '',
    thumbnail: data.thumbnail || '',
    duration: data.duration || '0:00',
    description: data.description || '',
    videoUrl: data.videoUrl || '',
    createdAt: data.createdAt || new Date().toISOString(),
    commentCount: data.commentCount || 0,
    viewCount: data.viewCount || 0,
    reactions: data.reactions || { likes: [] },
    comments: data.comments || [],
    user: {
      _id: userObj._id || '',
      username: userObj.username || '',
      firstName: userObj.firstName || '',
      lastName: userObj.lastName || '',
      profilePicture: userObj.profilePicture || '',
      subscribers: userObj.subscribers || 0,
    },
    isCommentsAllowed: data.isCommentsAllowed
  };
};

const SharedVideoCard: React.FC<SharedVideoCardProps> = ({ 
  videoData, 
  messageSender,
  item, 
  formattedTime, 
  shouldShowTimestamp, 
  onUserPress,
  useOwnPositioning = false,
  isCurrentUser = false
}) => {
  const { theme } = useCustomTheme();
  const router = useRouter();
  const { setSelectedItem } = useGetVideoItemStore();
  const { userDetails } = useAuth();

  // Always fetch data when we only have minimal video info (just ID from deep link)
  const hasMinimalData = !videoData.videoUrl || !videoData.thumbnail || !videoData.user?.username;
  const needsCriticalData = hasMinimalData;
  
  // Fetch complete video data only if critical
  const { data: completeVideoResponse, isPending: isLoadingComplete } = useGetPost(
    needsCriticalData ? videoData._id : ''
  );

  // Extract video data from the GenericResponse
  const completeVideoData = completeVideoResponse?.data;

  // Fetch user profile if we don't have complete user data
  const hasCompleteUserData = videoData.user && typeof videoData.user === 'object' && videoData.user.username;
  const shouldFetchUserProfile = !hasCompleteUserData && (completeVideoData?.user && typeof completeVideoData.user === 'string');
  const userIdToFetch = shouldFetchUserProfile ? completeVideoData.user : '';
  
  const { data: userProfileResponse, isPending: isLoadingUserProfile } = useGetPublicProfile(userIdToFetch);
  
  // Extract user profile data - useGetPublicProfile returns data directly, not wrapped in .data
  const userProfileData = userProfileResponse;

  // Check if this is the current user's video to provide fallback data
  const isCurrentUserVideo = 
    videoData.user?._id === userDetails?._id || 
    completeVideoData?.user?._id === userDetails?._id ||
    (!videoData.user?._id && !completeVideoData?.user?._id); // If no user ID, assume current user

  // Always display the original video creator's profile, not the message sender's
  const getUserData = () => {
    const baseUser = videoData.user || {};
    
    // Priority 1: If we have fetched user profile data, use it (this is the video creator)
    if (userProfileData) {
      return {
        _id: userProfileData._id || '',
        username: userProfileData.username || 'Unknown',
        firstName: userProfileData.firstName || '',
        lastName: userProfileData.lastName || '',
        profilePicture: userProfileData.profilePicture || '',
        subscribers: userProfileData.subscribers || 0,
      };
    }
    
    // Priority 2: If we have a complete user object from original data, use it
    if (baseUser && typeof baseUser === 'object' && baseUser.username) {
      return {
        _id: baseUser._id || '',
        username: baseUser.username || 'Unknown',
        firstName: baseUser.firstName || '',
        lastName: baseUser.lastName || '',
        profilePicture: baseUser.profilePicture || '',
        subscribers: baseUser.subscribers || 0,
      };
    }
    
    // Priority 3: If we have complete video data with user as string ID, 
    // the profile should be fetched by useGetPublicProfile hook above
    if (completeVideoData?.user && typeof completeVideoData.user === 'string') {
      // Profile is being fetched, show loading or minimal data
      return {
        _id: completeVideoData.user,
        username: 'Loading...',
        firstName: '',
        lastName: '',
        profilePicture: '',
        subscribers: 0,
      };
    }
    
    // Priority 4: If complete video data has user object, use it
    if (completeVideoData?.user && typeof completeVideoData.user === 'object') {
      const videoUser = completeVideoData.user;
      return {
        _id: videoUser._id || '',
        username: videoUser.username || 'Unknown',
        firstName: videoUser.firstName || '',
        lastName: videoUser.lastName || '',
        profilePicture: videoUser.profilePicture || '',
        subscribers: videoUser.subscribers || 0,
      };
    }
    
    // Last Resort: Use message sender only if we have absolutely no video creator data
    // This should be rare and indicates incomplete shared video data
    if (messageSender && !baseUser._id && !completeVideoData?.user) {
      return {
        _id: messageSender._id || '',
        username: messageSender.username || 'Unknown',
        firstName: messageSender.firstName || '',
        lastName: messageSender.lastName || '',
        profilePicture: messageSender.profilePicture || '',
        subscribers: 0,
      };
    }
    
    // Fallback: Return minimal user data for the video creator
    return {
      _id: baseUser._id || completeVideoData?.user || '',
      username: baseUser.username || 'Unknown',
      firstName: baseUser.firstName || '',
      lastName: baseUser.lastName || '',
      profilePicture: baseUser.profilePicture || '',
      subscribers: baseUser.subscribers || 0,
    };
  };

  // Merge complete data with user data (fetched or original)
  const finalVideoData = completeVideoData ? {
    ...completeVideoData,
    // Use fetched user data, original user object, or keep as is
    user: getUserData()
  } : normalizeVideoData({
    ...videoData,
    user: getUserData()
  });

  // Use direct reference instead of deep copy
  const safeVideoData = finalVideoData;

  const handleVideoPress = () => {
    // Don't allow click if still loading critical data
    if (needsCriticalData && isLoadingComplete) {
      console.log('SharedVideoCard: Still loading critical video data...');
      return;
    }

    if (!safeVideoData?.videoUrl) {
      console.log('SharedVideoCard: No video URL available');
      return;
    }
    
    // Use finalVideoData which includes the complete user object
    const dataToSet = finalVideoData;
    
    // Set the selected item in the global store
    setSelectedItem(dataToSet);
    
    // Navigate to video player with proper parameters
    router.push(`/(home)/VideoPlayer?videoId=${safeVideoData._id}&videoData=${encodeURIComponent(JSON.stringify(safeVideoData))}`);
  };

  const getUserDisplayName = () => {
    const user = safeVideoData?.user || {};
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const username = user.username || '';
    
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || username || 'Unknown User';
  };

  // Static skeleton without animations to prevent blocking
  const SkeletonBox = ({ style }: { style: any }) => {
    const isDark = useColorScheme() === 'dark';
    const backgroundColor = isDark ? '#1A1F2B' : '#E1E9EE';
    
    return (
      <View style={[style, { backgroundColor }]} />
    );
  };

  // Show skeleton loading state if fetching critical data or user profile
  if ((needsCriticalData && isLoadingComplete) || (shouldFetchUserProfile && isLoadingUserProfile)) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[theme].cardBackground }]}>
        {/* Video Thumbnail Skeleton */}
        <View style={styles.videoContainer}>
          <SkeletonBox style={styles.skeletonThumbnail} />
          
          {/* User Info Overlay Skeleton */}
          <View style={styles.userInfoOverlay}>
            <SkeletonBox style={styles.skeletonAvatarSmall} />
            <View style={styles.userInfoText}>
              <SkeletonBox style={styles.skeletonUsernameSmall} />
              <SkeletonBox style={styles.skeletonHandleSmall} />
            </View>
          </View>
          
          {/* Play button overlay */}
          <View style={styles.playButtonOverlay}>
            <SkeletonBox style={styles.skeletonPlayButton} />
          </View>
          {/* Duration badge */}
          <SkeletonBox style={styles.skeletonDuration} />
        </View>
        
        {/* Description Skeleton */}
        <View style={styles.descriptionContainer}>
          <SkeletonBox style={styles.skeletonDescription1} />
          <SkeletonBox style={styles.skeletonDescription2} />
        </View>
      </View>
    );
  }

  // Don't render if no safe video data
  if (!safeVideoData) {
    return null;
  }

  const renderVideoContent = () => (
    <View style={[styles.container, { backgroundColor: Colors[theme].cardBackground }]}>
      {/* Video Thumbnail */}
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={handleVideoPress}
        activeOpacity={0.8}
      >
        <Image source={{ uri: safeVideoData.thumbnail }} style={styles.videoThumbnail} />

        {/* User Info Overlay - Top Left */}
        <View style={styles.userInfoOverlay}>
          <Avatar
            imageSource={safeVideoData?.user?.profilePicture || videoData?.user?.profilePicture}
            size={32}
            uri
            gapSize={2}
          />
          <View style={styles.userInfoText}>
            <Typography weight="500" size={12} color="#fff">
              {getUserDisplayName()}
            </Typography>
            <Typography size={10} color="rgba(255, 255, 255, 0.8)">
              @{safeVideoData?.user?.username || videoData?.user?.username || 'unknown'}
            </Typography>
          </View>
        </View>

        {/* Play Button Overlay */}
        <View style={styles.playButtonOverlay}>
          {/* <View style={styles.playButton}>
            <Ionicons name="play" size={24} color="#fff" />
          </View> */}
        </View>

        {/* Duration Badge */}
        <View style={styles.durationBadge}>
          <Typography size={10} color="#fff" weight="500">
            {formatVideoDuration(safeVideoData.duration)}
          </Typography>
        </View>
      </TouchableOpacity>

      {/* Video Description - Below Thumbnail */}
      {safeVideoData.description && (
        <View style={styles.descriptionContainer}>
          <Typography size={14} textType="textBold" numberOfLines={3}>
            {safeVideoData.description}
          </Typography>
        </View>
      )}
    </View>
  );

  if (useOwnPositioning) {
    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.userMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isCurrentUser && item?.userId && (
          <MessageAvatar
            user={item.userId}
            onPress={() => onUserPress && onUserPress(typeof item.userId === "object" ? item.userId._id : item.userId)}
            disabled={!item.userId}
          />
        )}

        <View style={styles.messageWrapper}>
          {renderVideoContent()}
          
          <MessageTimestamp
            show={shouldShowTimestamp || false}
            time={formattedTime || ''}
            isOwnMessage={isCurrentUser}
          />
        </View>
      </View>
    );
  }

  return renderVideoContent();
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 4,
    marginVertical: 4,
    maxWidth: 320,
  },
  // Skeleton styles
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skeletonUsername: {
    width: 80,
    height: 14,
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonHandle: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
  skeletonDescription1: {
    width: '100%',
    height: 14,
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonDescription2: {
    width: '60%',
    height: 14,
    borderRadius: 4,
  },
  skeletonThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 4,
  },
  skeletonPlayButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  skeletonDuration: {
    width: 40,
    height: 20,
    borderRadius: 4,
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  skeletonAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  skeletonUsernameSmall: {
    width: 60,
    height: 12,
    borderRadius: 4,
    marginBottom: 2,
  },
  skeletonHandleSmall: {
    width: 50,
    height: 10,
    borderRadius: 4,
  },
  userInfoOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.6)',
    // paddingHorizontal: 8,
    // paddingVertical: 4,
    borderRadius: 16,
    zIndex: 1,
  },
  userInfoText: {
    marginLeft: 6,
  },
  videoContainer: {
    position: 'relative',
      borderRadius: 4,

    overflow: 'hidden',
    // marginBottom: 8,
  },
  videoThumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 4,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  descriptionContainer: {
    marginTop: 2,
    paddingHorizontal: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderColor + '20',
  },
  actionButton: {
    padding: 4,
  },
  // Positioning styles for community chat
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  messageWrapper: {
    maxWidth: '75%',
    marginHorizontal: 8,
  },
});

export default SharedVideoCard;