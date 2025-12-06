import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Constants from 'expo-constants';

const SoftGradientBackground: React.FC = () => {
  const { theme } = useCustomTheme();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          theme === 'light'
            ? [
                'rgba(175, 77, 255, 0.25)',  // soft purple
                'rgba(0, 212, 123, 0.25)',   // soft green
                'rgba(247, 173, 0, 0.25)',   // soft orange
              ]
            : [
                'rgba(175, 77, 255, 0.15)',  // softer purple for dark mode
                'rgba(0, 212, 123, 0.15)',   // softer green for dark mode
                'rgba(247, 173, 0, 0.15)',   // softer orange for dark mode
              ]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -Constants.statusBarHeight,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
});

export default SoftGradientBackground;
