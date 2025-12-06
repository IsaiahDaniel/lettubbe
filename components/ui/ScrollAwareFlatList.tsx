import React, { useRef, useCallback } from 'react';
import { FlatList, FlatListProps, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useNavigationVisibility } from '@/contexts/NavigationVisibilityContext';

interface ScrollAwareFlatListProps<T = any> extends FlatListProps<T> {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag?: () => void;
  onScrollEndDrag?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  // Explicitly include viewability props that were being lost
  onViewableItemsChanged?: FlatListProps<T>['onViewableItemsChanged'];
  viewabilityConfig?: FlatListProps<T>['viewabilityConfig'];
}

const ScrollAwareFlatList = React.forwardRef<FlatList, ScrollAwareFlatListProps>(
  ({ 
    onScroll, 
    onScrollBeginDrag, 
    onScrollEndDrag, 
    onMomentumScrollEnd,
    onViewableItemsChanged,
    viewabilityConfig,
    ...props 
  }, ref) => {
    // Debug: Verify viewability props are being passed through
    // if (onViewableItemsChanged) {
    //   console.log('🎥 SCROLL_AWARE_FLATLIST: ✅ onViewableItemsChanged prop received');
    // } else {
    //   console.log('🎥 SCROLL_AWARE_FLATLIST: ❌ onViewableItemsChanged prop MISSING');
    // }
    
    // if (viewabilityConfig) {
    //   console.log('🎥 SCROLL_AWARE_FLATLIST: ✅ viewabilityConfig prop received:', viewabilityConfig);
    // } else {
    //   console.log('🎥 SCROLL_AWARE_FLATLIST: ❌ viewabilityConfig prop MISSING');
    // }
    
    // Use optional navigation visibility context - fallback to no-op functions if not available
    let showNavigation: () => void;
    let hideNavigation: () => void;
    
    try {
      const navigationContext = useNavigationVisibility();
      showNavigation = navigationContext.showNavigation;
      hideNavigation = navigationContext.hideNavigation;
    } catch (error) {
      // If context is not available use no-op functions
      showNavigation = () => {};
      hideNavigation = () => {};
    }
    
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
      <FlatList
        ref={ref}
        {...props}
        // Explicitly pass through viewability props (CRITICAL for video autoplay)
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // Override scroll handlers with our enhanced versions
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
      />
    );
  }
);

ScrollAwareFlatList.displayName = 'ScrollAwareFlatList';

export default ScrollAwareFlatList;