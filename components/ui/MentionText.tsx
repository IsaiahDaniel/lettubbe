import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { useAlert } from '@/components/ui/AlertProvider';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';
import { MentionUser, DisplayMentionUser } from '@/store/videoUploadStore';
import { MentionTextProps } from '@/helpers/types/mentions.types';
import { 
  renderMentionSegments, 
  getMentionColor,
  getMentionAccessibilityLabel 
} from '@/helpers/utils/mentionRendering';
import { HASHTAG_UI_CONFIG } from '@/constants/hashtags';

const MentionText: React.FC<MentionTextProps> = ({
  text,
  mentions = [],
  style,
  size,
  weight,
  color,
  numberOfLines,
  onMentionPress,
  onUserProfilePress,
  onHashtagPress,
  onTextLayout,
}) => {
  const { theme } = useCustomTheme();
  const router = useRouter();  
  const { showConfirm } = useAlert();

  // Parse text and create segments using utility function
  const segments = renderMentionSegments(text, mentions);

  // Handle mention press
  const handleMentionPress = (mention?: MentionUser | DisplayMentionUser) => {
    if (!mention) return;

    if (onMentionPress) {
      onMentionPress(mention);
    } else if (onUserProfilePress) {
      // Check if this is a DisplayMentionUser with userId
      if (mention && 'userId' in mention && mention.userId) {
        onUserProfilePress(mention.userId);
      } else {
        console.log('Mention clicked but no userId available:', mention?.username);
      }
    }
  };

  // Handle hashtag press
  const handleHashtagPress = (hashtag: string) => {
    if (onHashtagPress) {
      onHashtagPress(hashtag);
    } else {
      // Default behavior: navigate to explore with hashtag search
      router.push(`/(tabs)/explore?search=${encodeURIComponent(hashtag)}`);
    }
  };

  // Handle URL press with confirmation
  const handleUrlPress = (url: string) => {
    console.log('URL clicked:', url);
    console.log('showConfirm function:', showConfirm);
    
    // Ensure URL has protocol for proper opening
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;
    
    // Fallback: if showConfirm is not available, open directly for testing
    if (!showConfirm) {
      console.log('showConfirm not available, opening URL directly');
      Linking.openURL(formattedUrl).catch(err => {
        console.error('Failed to open URL:', err);
      });
      return;
    }
      
    showConfirm(
      'Leaving App',
      `You're about to visit ${url}. This will open your browser. Do you want to continue?`,
      () => {
        console.log('Opening URL:', formattedUrl);
        Linking.openURL(formattedUrl).catch(err => {
          console.error('Failed to open URL:', err);
        });
      },
      undefined,
      'Continue',
      'Cancel'
    );
  };

  // Render segments
  const renderSegments = () => {
    return segments.map((segment, index) => {
      if (segment.isMention) {
        return (
          <Text
            key={index}
            style={[{ 
              fontSize: size,
              fontWeight: weight || "600",
              color: getMentionColor(),
            }, style]}
            onPress={() => handleMentionPress(segment.mention)}
            accessibilityRole="button"
            accessibilityLabel={getMentionAccessibilityLabel(segment.mention)}
          >
            {segment.text}
          </Text>
        );
      } else if (segment.isHashtag) {
        return (
          <Text
            key={index}
            style={[{
              fontSize: size,
              fontWeight: HASHTAG_UI_CONFIG.FONT_WEIGHT,
              color: HASHTAG_UI_CONFIG.COLOR,
              includeFontPadding: false,
            }, style]}
            onPress={() => handleHashtagPress(segment.text)}
            accessibilityRole="button"
            accessibilityLabel={`Hashtag ${segment.hashtag}`}
          >
            {segment.text}
          </Text>
        );
      } else if (segment.isUrl) {
        return (
          <Text
            key={index}
            style={[{
              fontSize: size,
              fontWeight: weight,
              color: "#007AFF",
              textDecorationLine: 'underline',
              includeFontPadding: false,
            }, style]}
            onPress={() => handleUrlPress(segment.text)}
            accessibilityRole="button"
            accessibilityLabel={`Link to ${segment.text}`}
          >
            {segment.text}
          </Text>
        );
      } else {
        return (
          <Text
            key={index}
            style={[{
              fontSize: size,
              fontWeight: weight,
              color: color,
              includeFontPadding: false, // Android-specific: removes extra padding
            }, style]}
          >
            {segment.text}
          </Text>
        );
      }
    });
  };

  if (segments.length === 1 && !segments[0].isMention && !segments[0].isUrl && !segments[0].isHashtag) {
    // No mentions or URLs, render as normal text
    return (
      <Typography
        size={size}
        weight={weight}
        color={color}
        style={style}
        numberOfLines={numberOfLines}
        onTextLayout={handleTextLayout}
      >
        {text}
      </Typography>
    );
  }

  // Handle text layout to detect truncation
  const handleTextLayout = (event: any) => {
    if (onTextLayout && numberOfLines) {
      // Check if text is truncated by comparing number of lines
      const { lines } = event.nativeEvent;
      const isTruncated = lines && lines.length > numberOfLines;
      onTextLayout(isTruncated);
    }
  };

  // Render with mentions
  return (
    <Text
      style={[style, { includeFontPadding: false }]}
      numberOfLines={numberOfLines}
      onTextLayout={handleTextLayout}
    >
      {renderSegments()}
    </Text>
  );
};

export default MentionText;