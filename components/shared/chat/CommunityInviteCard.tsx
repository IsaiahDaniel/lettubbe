import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Avatar from '@/components/ui/Avatar';
import { Feather } from '@expo/vector-icons';
import MessageAvatar from './MessageAvatar';
import MessageTimestamp from './renderers/MessageTimestamp';
import { useGetCommunity } from '@/hooks/community/useGetCommunity';

interface CommunityInviteCardProps {
  communityId: string;
  communityName: string;
  communityAvatar?: string;
  memberCount: number;
  invitedBy: {
    username: string;
    firstName?: string;
    lastName?: string;
  };
  description?: string;
  isWebLink?: boolean; // Flag to indicate this came from a web URL
  item?: any;
  formattedTime?: string;
  shouldShowTimestamp?: boolean;
  onUserPress?: (userId: string) => void;
  useOwnPositioning?: boolean;
  isCurrentUser?: boolean;
}

const CommunityInviteCard: React.FC<CommunityInviteCardProps> = ({
  communityId,
  communityName,
  communityAvatar,
  memberCount,
  invitedBy,
  description,
  isWebLink = false,
  item,
  formattedTime,
  shouldShowTimestamp,
  onUserPress,
  useOwnPositioning = false,
  isCurrentUser = false,
}) => {
  const { theme } = useCustomTheme();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  // Fetch community data if this is a web link with minimal data
  const { data: communityData, isLoading: isFetchingCommunity } = useGetCommunity(
    isWebLink && communityId ? communityId : ''
  );

  // Use fetched data if available, otherwise use provided props
  const finalCommunityData = isWebLink && communityData?.data ? {
    name: communityData.data.name || communityName || 'Community',
    avatar: communityData.data.photoUrl || communityData.data.avatar || communityAvatar || '',
    memberCount: communityData.data.members?.length || memberCount || 0,
    description: communityData.data.description || description || '',
  } : {
    name: communityName || 'Community',
    avatar: communityAvatar || '',
    memberCount: memberCount || 0,
    description: description || '',
  };

  const handleCommunityPress = () => {
    if (!communityId) return;
    
    // Navigate to community screen
    router.push(`/(community)/${communityId}`);
  };

  const handleJoinPress = async () => {
    if (isJoining) return;
    
    setIsJoining(true);
    try {
      // Handle join community logic
      console.log('Joining community:', communityId);
    } catch (error) {
      console.error('Error joining community:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const getInviterDisplayName = () => {
    const firstName = invitedBy?.firstName || '';
    const lastName = invitedBy?.lastName || '';
    const username = invitedBy?.username || '';
    
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || username || 'Someone';
  };

  // Static skeleton without animations to prevent blocking
  const SkeletonBox = ({ style }: { style: any }) => {
    const isDark = useColorScheme() === 'dark';
    const backgroundColor = isDark ? '#1A1F2B' : '#E1E9EE';
    
    return (
      <View style={[style, { backgroundColor }]} />
    );
  };

  // Show loading state for web links while fetching community data
  if (isWebLink && isFetchingCommunity) {
    return (
      <View style={styles.container}>
        <SkeletonBox style={styles.backgroundImage} />
        <View style={styles.darkOverlay} />
        <View style={styles.glassyOverlay}>
          <View style={styles.communityContent}>
            <SkeletonBox style={{ width: 150, height: 18, borderRadius: 4, marginBottom: 8 }} />
            <SkeletonBox style={{ width: 100, height: 14, borderRadius: 4, marginBottom: 8 }} />
            <SkeletonBox style={{ width: 200, height: 13, borderRadius: 4 }} />
          </View>
          <View style={styles.linkIndicator}>
            <SkeletonBox style={{ width: 80, height: 12, borderRadius: 4 }} />
          </View>
        </View>
      </View>
    );
  }

  const renderInviteContent = () => (
    <TouchableOpacity
      style={styles.container}
      onPress={handleCommunityPress}
      activeOpacity={0.9}
    >
      {/* Background Image */}
      {finalCommunityData.avatar && finalCommunityData.avatar.length > 0 ? (
        <Image
          source={{ uri: finalCommunityData.avatar }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.fallbackBackground, { backgroundColor: Colors[theme].borderColor }]}>
          <Feather name="users" size={40} color={Colors[theme].text} />
        </View>
      )}

      {/* Dark Overlay */}
      <View style={styles.darkOverlay} />

      {/* Glassy Content Overlay */}
      <View style={styles.glassyOverlay}>
        <View style={styles.communityContent}>
          {/* Community Name */}
          <Typography weight="700" size={16} color="#ffffff" numberOfLines={1}>
            {finalCommunityData.name}
          </Typography>
          
          {/* Member Count */}
          <Typography size={14} color="#ffffff" numberOfLines={1} style={styles.memberCount}>
            {finalCommunityData.memberCount > 0 ? `${finalCommunityData.memberCount} members` : 'Community'}
          </Typography>

          {/* Description */}
          {finalCommunityData.description && (
            <Typography size={13} color="#ffffff" numberOfLines={2} style={styles.description}>
              {finalCommunityData.description}
            </Typography>
          )}
        </View>

        {/* Link Indicator */}
        <View style={styles.linkIndicator}>
          <Feather name="external-link" size={14} color="#ffffff" />
          <Typography size={12} color="#ffffff" style={{ marginLeft: 4, opacity: 0.9 }}>
            Tap to open
          </Typography>
        </View>
      </View>
    </TouchableOpacity>
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
          {renderInviteContent()}
          
          <MessageTimestamp
            show={shouldShowTimestamp || false}
            time={formattedTime || ''}
            isOwnMessage={isCurrentUser}
          />
        </View>
      </View>
    );
  }

  return renderInviteContent();
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginVertical: 4,
    minWidth: 280,
    maxWidth: 320,
    height: 280,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  fallbackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  glassyOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    padding: 16,
    paddingTop: 20,
  },
  communityContent: {
    marginBottom: 12,
  },
  memberCount: {
    marginTop: 4,
    opacity: 0.9,
  },
  description: {
    marginTop: 6,
    lineHeight: 18,
    opacity: 0.9,
  },
  linkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
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

export default CommunityInviteCard;