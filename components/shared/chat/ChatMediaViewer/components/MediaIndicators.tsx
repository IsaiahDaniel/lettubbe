import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { MediaIndicatorsProps } from '../types';

export const MediaIndicators: React.FC<MediaIndicatorsProps> = ({
  visible,
  currentIndex,
  totalItems,
}) => {
  if (!visible || totalItems <= 1) return null;

  return (
    <View style={styles.indicators}>
      {Array.from({ length: totalItems }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.indicator,
            {
              backgroundColor: index === currentIndex ? 'white' : 'rgba(255,255,255,0.4)',
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  indicators: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 80 : 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});