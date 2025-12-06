import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';
import { Comment } from '@/helpers/types/comments/Types';
import Typography from '@/components/ui/Typography/Typography';
import { MentionText } from '@/components/ui/inputs/mentions';
import { parseMentionsFromBackend } from '@/helpers/utils/mentionUtils';
import Avatar from '@/components/ui/Avatar';
import { formatTimePost } from '@/helpers/utils/util';
import { useCustomTheme } from '@/hooks/useCustomTheme';

const DEFAULT_AVATAR_URL = "";

interface OriginalCommentDisplayProps {
  comment: Comment;
  theme: string;
  currentUserId?: string;
}

const OriginalCommentDisplay: React.FC<OriginalCommentDisplayProps> = ({
  comment,
  currentUserId,
}) => {
  const router = useRouter();
  const { theme } = useCustomTheme();

  const handleUserProfilePress = (userId: string) => {
    if (userId === currentUserId) {
      router.push("/(tabs)/profile");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={styles.header}>
        <Avatar
          imageSource={comment.user?.profilePicture || DEFAULT_AVATAR_URL}
          uri={true}
          size={36}
          ringColor={Colors[theme].avatar}
          gapSize={2.4}
          showRing={true}
          expandable={false}
        />
        <View style={styles.meta}>
          <Typography
            weight="600"
            size={14}
            textType="textBold"
            style={styles.username}
          >
            {comment.user?.username}
          </Typography>
          <Typography size={12} color="#BFBFBF">
            {formatTimePost(comment.createdAt)}
          </Typography>
        </View>
      </View>
      
      <View style={styles.text}>
        <MentionText
          text={comment.text}
          mentions={parseMentionsFromBackend(comment.text, comment.mentions || []).mentions}
          size={14}
          weight="400"
          color={Colors[theme].textBold}
          onUserProfilePress={handleUserProfilePress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    marginLeft: 12,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    textTransform: 'capitalize',
  },
  text: {
    marginLeft: 48,
  },
});

export default OriginalCommentDisplay;