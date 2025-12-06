import { useRef, useCallback, useEffect } from 'react';
import { Animated } from 'react-native';

interface UseScrollAwareNavigationProps {
  threshold?: number;
  hideDelay?: number;
  showDelay?: number;
}

export const useScrollAwareNavigation = ({
  threshold = 5,
  hideDelay = 100,
  showDelay = 300,
}: UseScrollAwareNavigationProps = {}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isNavVisible = useRef(true);
  const scrollDirection = useRef<'up' | 'down'>('up');
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const showTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const navVisibilityValue = useRef(new Animated.Value(1)).current;
  
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

  const showNavigation = useCallback(() => {
    clearTimeouts();
    if (!isNavVisible.current) {
      isNavVisible.current = true;
      Animated.spring(navVisibilityValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [clearTimeouts, navVisibilityValue]);

  const hideNavigation = useCallback(() => {
    clearTimeouts();
    if (isNavVisible.current) {
      isNavVisible.current = false;
      Animated.spring(navVisibilityValue, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [clearTimeouts, navVisibilityValue]);

  const onScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const delta = currentScrollY - lastScrollY.current;
    
    // Determine scroll direction
    const newDirection = delta > 0 ? 'down' : 'up';
    
    // Only act if scroll direction changed or significant scroll occurred
    if (Math.abs(delta) > threshold) {
      clearTimeouts();
      
      if (newDirection === 'down' && scrollDirection.current !== 'down') {
        // Scrolling down - hide navigation with delay
        scrollDirection.current = 'down';
        hideTimeout.current = setTimeout(() => {
          hideNavigation();
        }, hideDelay);
      } else if (newDirection === 'up' && scrollDirection.current !== 'up') {
        // Scrolling up - show navigation with shorter delay
        scrollDirection.current = 'up';
        showTimeout.current = setTimeout(() => {
          showNavigation();
        }, showDelay);
      }
    }
    
    lastScrollY.current = currentScrollY;
    scrollY.setValue(currentScrollY);
  }, [threshold, hideDelay, showDelay, clearTimeouts, hideNavigation, showNavigation, scrollY]);

  const onScrollBeginDrag = useCallback(() => {
    clearTimeouts();
  }, [clearTimeouts]);

  const onScrollEndDrag = useCallback(() => {
    // Show navigation when user stops scrolling
    showTimeout.current = setTimeout(() => {
      showNavigation();
    }, showDelay);
  }, [showNavigation, showDelay]);

  const onMomentumScrollEnd = useCallback(() => {
    // Show navigation when momentum scroll ends
    showTimeout.current = setTimeout(() => {
      showNavigation();
    }, showDelay);
  }, [showNavigation, showDelay]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  // Reset navigation visibility when component mounts
  useEffect(() => {
    showNavigation();
  }, [showNavigation]);

  return {
    isNavVisible: isNavVisible.current,
    navVisibilityValue,
    scrollHandlers: {
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
      onMomentumScrollEnd,
      scrollEventThrottle: 16,
    },
    showNavigation,
    hideNavigation,
  };
};