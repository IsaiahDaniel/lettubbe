import React from 'react';
import { View, StyleSheet } from 'react-native';
import Typography from './Typography/Typography';
import { Colors } from '@/constants/Colors';

interface BadgeProps {
  count: number;
  maxCount?: number;
  size?: 'small' | 'medium';
  backgroundColor?: string;
  textColor?: string;
  position?: 'absolute' | 'relative';
}

const Badge: React.FC<BadgeProps> = ({
  count,
  maxCount = 99,
  size = 'small',
  backgroundColor = Colors.general.purple,
  textColor = '#FFFFFF',
  position = 'absolute',
}) => {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const isSmallSize = size === 'small';

  return (
    <View
      style={[
        position === 'absolute' ? styles.badgeAbsolute : styles.badgeRelative,
        {
          backgroundColor,
          minWidth: isSmallSize ? 18 : 20,
          height: isSmallSize ? 18 : 20,
          borderRadius: isSmallSize ? 100 : 100,
        },
      ]}
    >
      <Typography
        size={isSmallSize ? 10 : 10}
        color={textColor}
        weight="600"
        style={styles.badgeText}
      >
        {displayCount}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeAbsolute: {
    position: 'absolute',
    top: -4,
    right: -6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  badgeRelative: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    textAlign: 'center',
  },
});

export default Badge;