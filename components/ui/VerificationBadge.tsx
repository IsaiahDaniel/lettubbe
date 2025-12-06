import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Icons } from '@/constants';

export interface VerificationBadgeProps {
  level: 'gold' | 'platinum';
  size?: number;
  style?: any;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  level,
  size = 16,
  style
}) => {
  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'gold':
        return '#1DA1F2';
      case 'platinum':
        return '#1DA1F2';
      default:
        return '#1DA1F2';
        // return '#D4AF37';
    }
  };

  const badgeColor = getBadgeColor(level);

  return (
    <View style={[styles.container, style]}>
      <Image
        source={Icons.badge}
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            tintColor: badgeColor,
          }
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    // Base styles - size and tint applied inline
  },
});

export default VerificationBadge;