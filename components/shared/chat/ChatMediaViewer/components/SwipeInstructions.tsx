import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';

interface SwipeInstructionsProps {
  visible: boolean;
  hasMultipleItems: boolean;
}

export const SwipeInstructions: React.FC<SwipeInstructionsProps> = ({
  visible,
  hasMultipleItems,
}) => {
  if (!visible || !hasMultipleItems) return null;

  return (
    <View style={styles.swipeInstruction}>
      <Typography size={12} color="rgba(255,255,255,0.6)" style={styles.instructionText}>
        Swipe left or right to navigate
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeInstruction: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
});