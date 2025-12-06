import { View, StyleSheet, TouchableOpacity } from "react-native";
import React, { memo, useState, useCallback, useMemo } from "react";
import { router } from "expo-router";
import Typography from "@/components/ui/Typography/Typography";
import { VideoCardMetaInfoProps } from "@/helpers/types/feed/types";
import PostLikesDisplay from "@/components/shared/video/PostLikesDisplay";
import MentionText from "@/components/ui/MentionText";
import { parseMentionsFromBackend } from "@/helpers/utils/mentionUtils";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import VerificationBadge from "@/components/ui/VerificationBadge";

interface ExtendedVideoCardMetaInfoProps extends VideoCardMetaInfoProps {
  username?: string;
  onUsernamePress?: () => void;
  postId?: string;
  likeCount?: number;
  onAvatarPress?: (userId: string) => void;
  userSubscription?: {
    level: 'gold' | 'platinum';
    isVerified: boolean;
  };
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  contentContainer: {
    flexDirection: "row",
  },
  singleLineContent: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
  },
  multiLineContent: {
    flexDirection: "column",
  },
  usernameText: {
    marginRight: 4,
  },
  usernameButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  usernameWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  verificationBadge: {
    marginTop: 1,
    marginRight: 4
  },
  timeContainer: {
    marginTop: 0,
  },
  showMoreButton: {
    marginLeft: 0,
  },
});

// Helper function to check if text contains newlines
const containsNewlines = (text: string): boolean => {
  return text ? text.includes("\n") : false;
};

// Helper function to count words in a string
const countWords = (text: string): number => {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};

// Create a memoized component for the meta information section
export const VideoCardMetaInfo = memo(
  ({ 
    description, 
    formattedTime, 
    mentions = [],
    username = "", 
    onUsernamePress,
    postId,
    likeCount = 0,
    onAvatarPress,
    userSubscription
  }: ExtendedVideoCardMetaInfoProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { theme } = useCustomTheme();

    const toggleExpand = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

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

    const { shouldTruncate, displayText, isMultiLine } = useMemo(() => {
      if (!description) {
        return { shouldTruncate: false, displayText: "", isMultiLine: false };
      }

      const hasNewlines = containsNewlines(description);
      const wordCount = countWords(description);
      const isLongText = wordCount > 5;

      // Calculate total mention length from actual text (including @ symbol)
      // This counts all @mentions in the text, even if usernames are missing from mentions array
      const mentionMatches = description.match(/@\w+/g) || [];
      const mentionLength = mentionMatches.reduce((total, match) => total + match.length, 0);
      const hasMentions = mentionMatches.length > 0;
      
      // Calculate total text length for better visual estimation
      const totalTextLength = description.length;
      
      // If text has newlines, always use multiline layout
      // Lower thresholds to prevent text overflow in single-line mode
      // Using text-based mention detection to avoid issues with missing usernames in mentions array
      const isMultiLine = hasNewlines || isLongText || (hasMentions && (wordCount > 6 || mentionLength > 20 || totalTextLength > 50));
      const shouldTruncate = wordCount > 30 || hasNewlines;


      if (!shouldTruncate || isExpanded) {
        return { shouldTruncate, displayText: description, isMultiLine };
      }

      if (hasNewlines) {
        // Get first line if there are newlines
        const firstLine = description.split("\n")[0];
        return { shouldTruncate, displayText: firstLine, isMultiLine };
      } else {
        // For word-based truncation, ensure we don't cut mentions in half
        const words = description.split(/\s+/);
        let truncatedWords = words.slice(0, 30);
        
        // Check if the last word is a partial mention (starts with @ but doesn't end properly)
        const lastWord = truncatedWords[truncatedWords.length - 1];
        if (lastWord && lastWord.startsWith("@") && lastWord.length > 1) {
          // Find the full mention in the original text
          const lastWordIndex = description.lastIndexOf(lastWord);
          if (lastWordIndex >= 0) {
            const remainingText = description.substring(lastWordIndex);
            const mentionMatch = remainingText.match(/^@\w+/);
            if (mentionMatch) {
              // Replace the truncated mention with the complete one
              truncatedWords[truncatedWords.length - 1] = mentionMatch[0];
            }
          }
        }
        
        const truncatedText = truncatedWords.join(" ");
        return { shouldTruncate, displayText: truncatedText, isMultiLine };
      }
    }, [description, isExpanded, processedMentions]);

    const ContentContainer = isMultiLine ? 
      (
        <View style={styles.multiLineContent}>
          <TouchableOpacity 
            style={styles.usernameButton}
            onPress={onUsernamePress}
            activeOpacity={0.7}
          >
            <View style={styles.usernameWithBadge}>
              <Typography
                weight="600"
                size={14}
                lineHeight={20}
                style={styles.usernameText}
              >
                {username}
              </Typography>
              {userSubscription?.isVerified && (
                <VerificationBadge 
                  level={userSubscription.level}
                  size={14}
                  style={styles.verificationBadge}
                />
              )}
            </View>
          </TouchableOpacity>

          <View style={{ marginTop: 2 }}>
            <MentionText
              text={displayText}
              mentions={processedMentions}
              weight="400"
              size={14}
              color={Colors[theme].text}
              style={{ lineHeight: 20 }}
              onUserProfilePress={onAvatarPress}
              onHashtagPress={handleHashtagPress}
            />

            {/* Show more/less button */}
            {shouldTruncate && (
              <TouchableOpacity
                style={styles.showMoreButton}
                onPress={toggleExpand}
                activeOpacity={0.7}
              >
                <Typography
                  weight="500"
                  size={14}
                  lineHeight={20}
                  textType="secondary"
                >
                  {isExpanded ? " Show less" : "...more"}
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.singleLineContent}>
          {/* Username */}
          <TouchableOpacity 
            onPress={onUsernamePress}
            activeOpacity={0.7}
          >
            <View style={styles.usernameWithBadge}>
              <Typography
                weight="600"
                size={14}
                lineHeight={20}
                style={styles.usernameText}
              >
                {username}
              </Typography>
              {userSubscription?.isVerified && (
                <VerificationBadge 
                  level={userSubscription.level}
                  size={14}
                  style={styles.verificationBadge}
                />
              )}
            </View>
          </TouchableOpacity>

          {/* Description text */}
          <MentionText
            text={displayText}
            mentions={processedMentions}
            weight="400"
            size={14}
            color={Colors[theme].text}
            style={{ lineHeight: 20, flex: 1 }}
            onUserProfilePress={onAvatarPress}
            onHashtagPress={handleHashtagPress}
          />

          {/* Show more/less button */}
          {shouldTruncate && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={toggleExpand}
              activeOpacity={0.7}
            >
              <Typography
                weight="500"
                size={14}
                lineHeight={20}
                textType="secondary"
              >
                {isExpanded ? " Show less" : "...more"}
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      );

    return (
      <View style={styles.container}>
        {/* Post Likes Display */}
        {postId && (
          <PostLikesDisplay
            postId={postId}
            likeCount={likeCount}
            onAvatarPress={onAvatarPress}
          />
        )}

        {ContentContainer}

        <View style={styles.timeContainer}>
          <Typography weight="400" size={12} textType="secondary">
            {formattedTime}
          </Typography>
        </View>
      </View>
    );
  }
);

export default VideoCardMetaInfo;