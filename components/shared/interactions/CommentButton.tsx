import React, { memo } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { formatNumber } from '@/helpers/utils/formatting';

interface CommentButtonProps {
  commentCount: number;
  textColor: string;
  onPress: () => void;
  size?: number;
  showCount?: boolean;
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});

export const CommentButton = memo(({
  commentCount,
  textColor,
  onPress,
  size = 24,
  showCount = true,
}: CommentButtonProps) => {
  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={onPress} 
      testID="comment-button"
      activeOpacity={0.7}
    >
      <Ionicons name="chatbubble-outline" size={size} color={textColor} />
      {showCount && commentCount > 0 && (
        <Typography weight="500" color={textColor} textType="text">
          {formatNumber(commentCount)}
        </Typography>
      )}
    </TouchableOpacity>
  );
});