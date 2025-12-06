import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface AnimatedPaginationDotsProps {
  totalPhotos: number;
  activeIndex: number;
  containerStyle?: any;
}

export const AnimatedPaginationDots: React.FC<AnimatedPaginationDotsProps> = ({
  totalPhotos,
  activeIndex,
  containerStyle
}) => {
  const scrollX = useRef(new Animated.Value(activeIndex)).current;

  // Configuration
  const maxVisibleDots = 5;
  const smallDotSize = 5;
  const mediumDotSize = 6;
  const largeDotSize = 6;
  const activeDotScale = 1.4;
  const dotSpacing = 8;
  const inactiveDotOpacity = 0.5;

  useEffect(() => {
    Animated.timing(scrollX, {
      toValue: activeIndex,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [activeIndex]);

  // Calculate which dots should be visible in the 5-dot window
  const getVisibleDots = () => {
    if (totalPhotos <= maxVisibleDots) {
      // Show all dots when we have 5 or fewer
      return Array.from({ length: totalPhotos }, (_, i) => ({
        key: i,
        dotPosition: i, // Position within the visible window
        photoIndex: i,  // Actual photo index
      }));
    }

    // For 6+ photos, show a sliding window of 5 dots
    let windowStart = 0;

    if (activeIndex <= 2) {
      // Show photos 0,1,2,3,4
      windowStart = 0;
    } else if (activeIndex >= totalPhotos - 3) {
      // Show last 5 photos
      windowStart = totalPhotos - maxVisibleDots;
    } else {
      // Show window centered around active photo
      windowStart = activeIndex - 2;
    }

    return Array.from({ length: maxVisibleDots }, (_, i) => {
      const photoIndex = windowStart + i;
      return {
        key: `${photoIndex}-${windowStart}`,
        dotPosition: i, // Position within visible window
        photoIndex,     // Actual photo index
      };
    });
  };

  // Calculate dot size based on relationship to active dot
  const getDotSize = (photoIndex: number) => {
    if (photoIndex === activeIndex) {
      return largeDotSize; // Active dot is largest
    } else if (Math.abs(photoIndex - activeIndex) === 1) {
      return mediumDotSize; // Adjacent dots are medium
    } else {
      return smallDotSize; // All other dots are smallest
    }
  };

  const visibleDots = getVisibleDots();

  // Fixed dot animations for windowed rendering
  const getDotScale = (dotPhotoIndex: number) => {
    // Scale animation based on active index - fix for first dot
    if (dotPhotoIndex === activeIndex) {
      return activeDotScale; // Active dot is always scaled
    }
    return 1; // All other dots normal scale
  };

  const getDotOpacity = (dotPhotoIndex: number) => {
    // Fixed opacity - active dot is bright, others are dimmed
    if (dotPhotoIndex === activeIndex) {
      return 1; // Active dot is fully opaque
    }
    return inactiveDotOpacity; // Inactive dots are dimmed
  };

  // Calculate dynamic wrapper width based on visible dots
  const getWrapperWidth = () => {
    const visibleCount = Math.min(totalPhotos, maxVisibleDots);

    // Use medium dot size as base for more compact width
    const baseDotForWidth = mediumDotSize;
    const baseWidth = (baseDotForWidth + dotSpacing) * visibleCount - dotSpacing;

    // Add some extra space for the active dot scaling
    const scaleExtra = (largeDotSize * activeDotScale - baseDotForWidth) * 0.5;

    return baseWidth + scaleExtra;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.dotsWrapper, { width: getWrapperWidth() }]}>
        <View style={styles.dotsContainer}>
          {visibleDots.map((dot, index) => {
            const dotSize = getDotSize(dot.photoIndex);
            const scale = getDotScale(dot.photoIndex);
            const opacity = getDotOpacity(dot.photoIndex);

            return (
              <Animated.View
                key={dot.key}
                style={[
                  styles.dot,
                  {
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    backgroundColor: '#FFFFFF',
                    opacity,
                    transform: [{ scale }],
                    marginRight: index < visibleDots.length - 1 ? dotSpacing : 0,
                  }
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    // Base dot style
  },
});

export default AnimatedPaginationDots;