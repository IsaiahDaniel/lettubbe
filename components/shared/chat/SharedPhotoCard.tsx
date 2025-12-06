import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Avatar from '@/components/ui/Avatar';
import useGetPost from '@/hooks/feeds/useGetPost';
import useAuth from '@/hooks/auth/useAuth';
import { router } from 'expo-router';
import { useGetVideoItemStore } from '@/store/feedStore';
import useGetPublicProfile from '@/hooks/profile/useGetPublicProfile';
import MessageAvatar from './MessageAvatar';
import MessageTimestamp from './renderers/MessageTimestamp';

interface SharedPhotoCardProps {
  photoData: any; // Photo post data
  messageSender?: any; // The user who sent the message
  item?: any;
  formattedTime?: string;
  shouldShowTimestamp?: boolean;
  onUserPress?: (userId: string) => void;
  useOwnPositioning?: boolean; // control positioning
  isCurrentUser?: boolean;
}

// Function to normalize incomplete photo data
const normalizePhotoData = (data: any) => {
  // Ensure we have a user object even if data.user is null/undefined
  const userObj = data.user || {};
  
  return {
    _id: data._id || '',
    images: data.images || [],
    thumbnail: data.thumbnail || '',
    description: data.description || '',
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
  };
};

const SharedPhotoCard: React.FC<SharedPhotoCardProps> = ({ 
  photoData, 
  messageSender, 
  item, 
  formattedTime, 
  shouldShowTimestamp, 
  onUserPress,
  useOwnPositioning = false,
  isCurrentUser = false
}) => {
  const { theme } = useCustomTheme();
  const { userDetails } = useAuth();
  const { setSelectedItem } = useGetVideoItemStore();

  // Disable data fetching to prevent blocking
  // Only fetch if absolutely critical data is missing (images AND no fallback)
  const needsCriticalData = !photoData.images?.length && !photoData.thumbnail;
  
  // Fetch complete photo data only if critical
  const { data: completePhotoResponse, isPending: isLoadingComplete } = useGetPost(
    needsCriticalData ? photoData._id : ''
  );

  // Extract photo data from the GenericResponse
  const completePhotoData = completePhotoResponse?.data;

  // Fetch user profile if we don't have complete user data
  const hasCompleteUserData = photoData.user && typeof photoData.user === 'object' && photoData.user.username;
  const shouldFetchUserProfile = !hasCompleteUserData && (completePhotoData?.user && typeof completePhotoData.user === 'string');
  const userIdToFetch = shouldFetchUserProfile ? completePhotoData.user : '';
  
  const { data: userProfileResponse, isPending: isLoadingUserProfile } = useGetPublicProfile(userIdToFetch);
  
  // Extract user profile data - useGetPublicProfile returns data directly, not wrapped in .data
  const userProfileData = userProfileResponse;

  // Always display the original photo creator's profile, not the message sender's
  const getUserData = () => {
    const baseUser = photoData.user || {};
    
    // Priority 1: If we have fetched user profile data, use it (this is the photo creator)
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
    
    // Priority 3: If we have complete photo data with user as string ID, 
    // the profile should be fetched by useGetPublicProfile hook above
    if (completePhotoData?.user && typeof completePhotoData.user === 'string') {
      // Profile is being fetched, show loading or minimal data
      return {
        _id: completePhotoData.user,
        username: 'Loading...',
        firstName: '',
        lastName: '',
        profilePicture: '',
        subscribers: 0,
      };
    }
    
    // Priority 4: If complete photo data has user object, use it
    if (completePhotoData?.user && typeof completePhotoData.user === 'object') {
      const photoUser = completePhotoData.user;
      return {
        _id: photoUser._id || '',
        username: photoUser.username || 'Unknown',
        firstName: photoUser.firstName || '',
        lastName: photoUser.lastName || '',
        profilePicture: photoUser.profilePicture || '',
        subscribers: photoUser.subscribers || 0,
      };
    }
    
    // Last Resort: Use message sender only if we have absolutely no photo creator data
    // This should be rare and indicates incomplete shared photo data
    if (messageSender && !baseUser._id && !completePhotoData?.user) {
      return {
        _id: messageSender._id || '',
        username: messageSender.username || 'Unknown',
        firstName: messageSender.firstName || '',
        lastName: messageSender.lastName || '',
        profilePicture: messageSender.profilePicture || '',
        subscribers: 0,
      };
    }
    
    // Fallback: Return minimal user data for the photo creator
    return {
      _id: baseUser._id || completePhotoData?.user || '',
      username: baseUser.username || 'Unknown',
      firstName: baseUser.firstName || '',
      lastName: baseUser.lastName || '',
      profilePicture: baseUser.profilePicture || '',
      subscribers: baseUser.subscribers || 0,
    };
  };

  // Merge complete data with user data (fetched or original)
  const finalPhotoData = completePhotoData ? {
    ...completePhotoData,
    // Use fetched user data, original user object, or keep as is
    user: getUserData()
  } : normalizePhotoData({
    ...photoData,
    user: getUserData()
  });

  const safePhotoData = finalPhotoData;

  const handlePhotoPress = () => {
    // Don't allow click if still loading critical data
    if (needsCriticalData && isLoadingComplete) {
      console.log('SharedPhotoCard: Still loading critical photo data...');
      return;
    }

    if (!safePhotoData?.images?.length && !safePhotoData?.thumbnail) {
      console.log('SharedPhotoCard: No photo data available');
      return;
    }
    
    // Get photos array (prioritize images, fallback to thumbnail)
    const photosToShow = safePhotoData.images?.length > 0 
      ? safePhotoData.images 
      : safePhotoData.thumbnail 
        ? [safePhotoData.thumbnail] 
        : [];

    // Create media item for photo viewer
    const mediaItem = {
      _id: safePhotoData._id,
      thumbnail: safePhotoData.thumbnail || photosToShow[0] || "",
      duration: "",
      description: safePhotoData.description || "",
      videoUrl: "",
      photoUrl: photosToShow[0] || "",
      images: photosToShow,
      mediaType: 'photo' as const,
      createdAt: safePhotoData.createdAt,
      comments: safePhotoData.comments || [],
      reactions: safePhotoData.reactions || { likes: [] },
      viewCount: safePhotoData.viewCount || 0,
      commentCount: safePhotoData.commentCount || 0,
      user: {
        username: safePhotoData.user?.username || "",
        subscribers: [],
        _id: safePhotoData.user?._id || "",
        firstName: safePhotoData.user?.firstName || "",
        lastName: safePhotoData.user?.lastName || "",
        profilePicture: safePhotoData.user?.profilePicture || ""
      },
      isCommentsAllowed: safePhotoData.isCommentsAllowed
    };

    // Set the selected item in the store
    setSelectedItem(mediaItem);

    // Don't navigate - PhotoViewerModal will show automatically on current screen
  };

  const getUserDisplayName = () => {
    const user = safePhotoData?.user || {};
    
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
        {/* Photo Thumbnail Skeleton */}
        <View style={styles.photoContainer}>
          <SkeletonBox style={styles.skeletonThumbnail} />
          
          {/* User Info Overlay Skeleton */}
          <View style={styles.userInfoOverlay}>
            <SkeletonBox style={styles.skeletonAvatarSmall} />
            <View style={styles.userInfoText}>
              <SkeletonBox style={styles.skeletonUsernameSmall} />
              <SkeletonBox style={styles.skeletonHandleSmall} />
            </View>
          </View>
          
          {/* Photo count overlay */}
          <SkeletonBox style={styles.skeletonPhotoCount} />
        </View>
        
        {/* Description Skeleton */}
        <View style={styles.descriptionContainer}>
          <SkeletonBox style={styles.skeletonDescription1} />
          <SkeletonBox style={styles.skeletonDescription2} />
        </View>
      </View>
    );
  }

  // Don't render if no safe photo data
  if (!safePhotoData) {
    return null;
  }

  // Get photos array (prioritize images, fallback to thumbnail)
  const photosToShow = safePhotoData.images?.length > 0 
    ? safePhotoData.images 
    : safePhotoData.thumbnail 
      ? [safePhotoData.thumbnail] 
      : [];

  const renderPhotoContent = () => (
    <View style={[styles.container, { backgroundColor: Colors[theme].cardBackground }]}>
      {/* Photo Thumbnail */}
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={handlePhotoPress}
        activeOpacity={0.8}
      >
          <Image 
            source={{ uri: photosToShow[0] }} 
            style={styles.photoThumbnail} 
            resizeMode="cover"
          />

          {/* User Info Overlay - Top Left */}
          <View style={styles.userInfoOverlay}>
            <Avatar
              imageSource={safePhotoData?.user?.profilePicture || photoData?.user?.profilePicture}
              size={32}
              uri
              gapSize={2}
            />
            <View style={styles.userInfoText}>
              <Typography weight="500" size={12} color="#fff">
                {getUserDisplayName()}
              </Typography>
              <Typography size={10} color="rgba(255, 255, 255, 0.8)">
                @{safePhotoData?.user?.username || photoData?.user?.username || 'unknown'}
              </Typography>
            </View>
          </View>

          {/* Photo Count Badge (if multiple photos) */}
          {photosToShow.length > 1 && (
            <View style={styles.photoCountBadge}>
              <Typography size={10} color="#fff" weight="500">
                1/{photosToShow.length}
              </Typography>
            </View>
          )}

          {/* Camera icon overlay */}
          <View style={styles.photoIconOverlay}>
            {/* <View style={styles.photoIcon}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View> */}
          </View>
        </TouchableOpacity>

        {/* Photo Description */}
        {safePhotoData.description && (
          <View style={styles.descriptionContainer}>
            <Typography size={14} textType="textBold" numberOfLines={3}>
              {safePhotoData.description}
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
          {renderPhotoContent()}
          
          <MessageTimestamp
            show={shouldShowTimestamp || false}
            time={formattedTime || ''}
            isOwnMessage={isCurrentUser}
          />
        </View>
      </View>
    );
  }

  return renderPhotoContent();
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
    aspectRatio: 1,
    borderRadius: 4,
  },
  skeletonPhotoCount: {
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
  photoContainer: {
    position: 'relative',
    borderRadius: 4,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    aspectRatio: 1, // Square aspect ratio for photos
    borderRadius: 4,
  },
  photoIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  photoIcon: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCountBadge: {
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

export default SharedPhotoCard;