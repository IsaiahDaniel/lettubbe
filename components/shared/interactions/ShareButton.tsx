import React, { memo } from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Icons from '@/constants/Icons';

interface ShareButtonProps {
  textColor: string;
  onPress: () => void;
  size?: number;
}

export const ShareButton = memo(({
  textColor,
  onPress,
  size = 24,
}: ShareButtonProps) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      testID="share-button"
      activeOpacity={0.7}
    >
      <Image source={Icons.share} style={{ width: size, height: size, tintColor: textColor }} />
    </TouchableOpacity>
  );
});