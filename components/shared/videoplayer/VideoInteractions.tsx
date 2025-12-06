import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GlobalInteractionBar } from '@/components/shared/interactions/GlobalInteractionBar';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface VideoInteractionsProps {
  postId: string;
  likeCount: number;
  commentCount: number;
  playsCount: number;
  onCommentPress: () => void;
  onSharePress: () => void;
  onPlayPress: () => void;
  galleryRefetch: () => Promise<void>;
}

const VideoInteractions: React.FC<VideoInteractionsProps> = ({
  postId,
  likeCount,
  commentCount,
  playsCount,
  onCommentPress,
  onSharePress,
  onPlayPress,
  galleryRefetch,
}) => {
  const { theme } = useCustomTheme();

  return (
    <View style={styles.container}>
      <GlobalInteractionBar
        postId={postId}
        likeCount={likeCount}
        commentCount={commentCount}
        playsCount={playsCount}
        textColor={Colors[theme].textBold}
        onCommentPress={onCommentPress}
        onSharePress={onSharePress}
        onPlayPress={onPlayPress}
        galleryRefetch={galleryRefetch}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
});

export default VideoInteractions;