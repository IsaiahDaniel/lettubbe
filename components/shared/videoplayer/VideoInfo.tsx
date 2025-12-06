import React, { useState, useMemo, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Typography from '@/components/ui/Typography/Typography';
import MentionText from '@/components/ui/MentionText';
import { Colors } from '@/constants';
import { formatTimePost } from '@/helpers/utils/util';
import { parseMentionsFromBackend } from '@/helpers/utils/mentionUtils';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { MentionUser } from '@/store/videoUploadStore';

interface VideoInfoProps {
  description?: string;
  createdAt: string;
  mentions?: MentionUser[];
  onAvatarPress?: (userId: string) => void;
}

const VideoInfo: React.FC<VideoInfoProps> = ({ 
  description, 
  createdAt, 
  mentions = [], 
  onAvatarPress 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useCustomTheme();

  const toggleDescription = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle hashtag press
  const handleHashtagPress = useCallback((hashtag: string) => {
    router.push(`/(tabs)/explore?search=${encodeURIComponent(hashtag)}`);
  }, []);

  // Process mentions from backend format to frontend format
  const processedMentions = useMemo(() => {
    if (!mentions || mentions.length === 0) return [];
    
    const { mentions: parsedMentions } = parseMentionsFromBackend(
      description || "",
      mentions
    );
    
    return parsedMentions;
  }, [mentions, description]);

  const displayDescription = isExpanded
    ? description
    : description && description.length > 100
    ? `${description.substring(0, 100)}...`
    : description;

  const formattedTime = formatTimePost(createdAt);

  return (
    <View style={styles.container}>
      <View>
        <MentionText
          text={displayDescription || ""}
          mentions={processedMentions}
          weight="400"
          size={14}
          color={Colors[theme].text}
          style={{ lineHeight: 20 }}
          onUserProfilePress={onAvatarPress}
          onHashtagPress={handleHashtagPress}
        />
        {description && description.length > 100 && (
          <TouchableOpacity onPress={toggleDescription} style={styles.moreButton}>
            <Typography
              lineHeight={18}
              weight="500"
              color={Colors.general.blue}
              size={14}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Typography>
          </TouchableOpacity>
        )}
      </View>
      <Typography weight="400" size={12} textType="secondary">
        {formattedTime}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  moreButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
});

export default VideoInfo;