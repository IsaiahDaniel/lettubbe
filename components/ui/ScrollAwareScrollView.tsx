import React, { useRef, useCallback } from 'react';
import { ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useNavigationVisibility } from '@/contexts/NavigationVisibilityContext';

interface ScrollAwareScrollViewProps {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  children?: React.ReactNode;
  [key: string]: any;
}

const ScrollAwareScrollView = React.forwardRef<ScrollView, ScrollAwareScrollViewProps>(
  ({ onScroll, onScrollBeginDrag, onScrollEndDrag, onMomentumScrollEnd, ...props }, ref) => {
    const { showNavigation, hideNavigation } = useNavigationVisibility();
    
    const lastScrollY = useRef(0);
    const scrollDirection = useRef<'up' | 'down'>('up');
    const hideTimeout = useRef<NodeJS.Timeout | null>(null);
    const showTimeout = useRef<NodeJS.Timeout | null>(null);
    
    const clearTimeouts = useCallback(() => {
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
        hideTimeout.current = null;
      }
      if (showTimeout.current) {
        clearTimeout(showTimeout.current);
        showTimeout.current = null;
      }
    }, []);

    const handleScroll = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        // Call original onScroll if provided
        if (onScroll) {
          onScroll(event);
        }

        const currentScrollY = event.nativeEvent.contentOffset.y;
        const delta = currentScrollY - lastScrollY.current;
        
        // Always show if at top of scroll
        if (currentScrollY < 30) {
          clearTimeouts();
          showNavigation();
          lastScrollY.current = currentScrollY;
          return;
        }
        
        // Only act if scroll is significant enough (reduced threshold)
        if (Math.abs(delta) > 2) {
          const newDirection = delta > 0 ? 'down' : 'up';
          
          clearTimeouts();
          
          if (newDirection === 'down') {
            // Hide immediately when scrolling down (any amount)
            scrollDirection.current = newDirection;
            hideNavigation();
          } else if (newDirection === 'up') {
            // Show immediately when scrolling up
            scrollDirection.current = newDirection;
            showNavigation();
          }
        }
        
        lastScrollY.current = currentScrollY;
      },
      [onScroll, clearTimeouts, hideNavigation, showNavigation]
    );

    const handleScrollBeginDrag = useCallback(() => {
      clearTimeouts();
      
      // Call original onScrollBeginDrag if provided
      if (onScrollBeginDrag) {
        onScrollBeginDrag();
      }
    }, [onScrollBeginDrag, clearTimeouts]);

    const handleScrollEndDrag = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        // Show navigation after a small delay when user stops scrolling
        clearTimeouts();
        showTimeout.current = setTimeout(() => {
          showNavigation();
        }, 200);
        
        // Call original onScrollEndDrag if provided
        if (onScrollEndDrag) {
          onScrollEndDrag(event);
        }
      },
      [onScrollEndDrag, showNavigation, clearTimeouts]
    );

    const handleMomentumScrollEnd = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        // Show navigation when momentum scroll ends after short delay
        clearTimeouts();
        showTimeout.current = setTimeout(() => {
          showNavigation();
        }, 300);
        
        // Call original onMomentumScrollEnd if provided
        if (onMomentumScrollEnd) {
          onMomentumScrollEnd(event);
        }
      },
      [onMomentumScrollEnd, showNavigation, clearTimeouts]
    );

    return (
      <ScrollView
        ref={ref}
        {...props}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      />
    );
  }
);

ScrollAwareScrollView.displayName = 'ScrollAwareScrollView';

export default ScrollAwareScrollView;