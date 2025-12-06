import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Video } from "@/helpers/types/feed/types";
import { useRouter } from "expo-router";
import {
  INITIAL_NUM_TO_RENDER,
  MAX_TO_RENDER,
  SCROLL_EVENT_THROTTLE,
  SCROLL_SETTLE_DELAY,
  UPDATE_CELLS_BATCHING,
  WINDOW_SIZE,
} from "@/constants/screen-constants/feed/feed/feed.constants";
import {
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  AppState,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { BackHandler, ToastAndroid, Platform, Alert } from "react-native";

const useHomeScreenOptimization = (
  notificationsCount: any,
  isError: boolean,
  isPending: boolean,
  setSelectedItem: any,
  setShowFilter: any,
  feedsLength: number = 0,
) => {
  const router = useRouter();
  // scroll handling
  const scrollRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const viewportCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const performanceCheckRef = useRef<NodeJS.Timeout | null>(null);
  const appStateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);
  
  // Stable reference for notifications to reduce re-render frequency
  const prevNotificationCountRef = useRef(notificationsCount);
  const stableNotificationCountRef = useRef(notificationsCount);

  // Memory management state with debouncing
  const [isLowMemory, setIsLowMemory] = useState(false);
  const lowMemoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update stable reference only when notification count meaningfully changes
  useEffect(() => {
    const currentCount = typeof notificationsCount === 'number' ? notificationsCount : notificationsCount?.data;
    const prevCount = typeof prevNotificationCountRef.current === 'number' ? prevNotificationCountRef.current : prevNotificationCountRef.current?.data;
    
    // Only update if the count actually changed (not just the object reference)
    if (currentCount !== prevCount) {
      console.log('🔔 [OPTIMIZATION] Notification count changed:', prevCount, '→', currentCount);
      stableNotificationCountRef.current = notificationsCount;
      prevNotificationCountRef.current = notificationsCount;
    }
  }, [notificationsCount]);
  
  // Memoized values with stable comparison to prevent unnecessary re-renders
  const hasNotifications = useMemo(() => {
    // Use stable reference to prevent re-renders from object reference changes
    const count = typeof stableNotificationCountRef.current === 'number' ? 
      stableNotificationCountRef.current : 
      stableNotificationCountRef.current?.data;
    const hasNotifs = count > 0;
    
    return hasNotifs;
  }, [stableNotificationCountRef.current]);

  const showVideoFeed = useMemo(
    () => true, // Always show video feed - cached posts or fresh data will be displayed
    [isPending, isError]
  );

  const showSkeletons = useMemo(
    () => isPending && !isError,
    [isPending, isError]
  );

  const showError = useMemo(() => isError && !isPending && feedsLength === 0, [isError, isPending, feedsLength]);

  const handleFilterClose = useCallback(() => {
    setShowFilter(false);
  }, [setShowFilter]);

  // scroll handlers memory managed
  const handleScrollBeginDrag = useCallback(() => {
    isScrollingRef.current = true;

    // Clear any pending viewport checks
    if (viewportCheckTimeoutRef.current) {
      clearTimeout(viewportCheckTimeoutRef.current);
      viewportCheckTimeoutRef.current = null;
    }
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Continue to track that we're scrolling
      isScrollingRef.current = true;

      // Clear any existing scroll timeout to prevent race conditions
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

      // Set a timeout to handle scroll end
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        scrollTimeoutRef.current = null; // Clear ref after execution
      }, SCROLL_SETTLE_DELAY);
    },
    []
  );

  const handleScrollEndDrag = useCallback(() => {
    // Don't immediately set scrolling to false as momentum scrolling might continue
  }, []);

  const handleMomentumScrollEnd = useCallback(() => {
    // The scroll timeout will handle the actual scroll end
  }, []);

  // Navigation handlers
  const handleVideoPress = useCallback(
    (item: Video) => {
      setSelectedItem(item);
      router.push({
        pathname: "/(home)/VideoPlayer",
        params: {
          item: item as any,
        },
      });
    },
    [setSelectedItem]
  );

  const handleNotificationPress = useCallback(() => {
    router.push("/(home)/NotificationScreen");
  }, [router]);


  // Memory-aware FlatList props
  const flatListProps = useMemo(
    () => ({
      removeClippedSubviews: false, // allow proper viewability detection for autoplay
      maxToRenderPerBatch: isLowMemory ? 2 : MAX_TO_RENDER,
      windowSize: isLowMemory ? 6 : WINDOW_SIZE,
      initialNumToRender: isLowMemory ? 2 : INITIAL_NUM_TO_RENDER,
      getItemLayout: undefined,
      scrollEventThrottle: SCROLL_EVENT_THROTTLE,
      updateCellsBatchingPeriod: isLowMemory ? 100 : UPDATE_CELLS_BATCHING,
      disableVirtualization: false,
      legacyImplementation: false,

      // Memory-specific optimizations
      maintainVisibleContentPosition: isLowMemory
        ? undefined
        : {
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 100,
          },
    }),
    [isLowMemory]
  );



  // App state handling with debouncing to prevent oscillation
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      // Clear any existing timeouts to prevent race conditions
      if (lowMemoryTimeoutRef.current) {
        clearTimeout(lowMemoryTimeoutRef.current);
        lowMemoryTimeoutRef.current = null;
      }
      if (appStateTimeoutRef.current) {
        clearTimeout(appStateTimeoutRef.current);
        appStateTimeoutRef.current = null;
      }

      if (nextAppState === "background" || nextAppState === "inactive") {
        // Debounce background state change to avoid rapid toggling
        lowMemoryTimeoutRef.current = setTimeout(() => {
          setIsLowMemory(true);
          lowMemoryTimeoutRef.current = null;
        }, 500); // 500ms delay to prevent rapid state changes
      } else if (nextAppState === "active") {
        // Immediate low memory reset when app becomes active
        setIsLowMemory(false);
        
        // Optional: Set low memory mode again after extended use
        appStateTimeoutRef.current = setTimeout(() => {
          // Only set low memory if app is still active
          if (AppState.currentState === "active") {
            setIsLowMemory(true);
          }
          appStateTimeoutRef.current = null;
        }, 30000); // 30 seconds of active use
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    
    return () => {
      subscription?.remove();
      // Clear all timeouts on unmount
      if (appStateTimeoutRef.current) {
        clearTimeout(appStateTimeoutRef.current);
        appStateTimeoutRef.current = null;
      }
      if (lowMemoryTimeoutRef.current) {
        clearTimeout(lowMemoryTimeoutRef.current);
        lowMemoryTimeoutRef.current = null;
      }
    };
  }, []);

  // Enhanced cleanup effect
  useEffect(() => {
    return () => {
      // Clear all timeout refs to prevent memory leaks
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }

      if (viewportCheckTimeoutRef.current) {
        clearTimeout(viewportCheckTimeoutRef.current);
        viewportCheckTimeoutRef.current = null;
      }

      if (performanceCheckRef.current) {
        clearInterval(performanceCheckRef.current);
        performanceCheckRef.current = null;
      }

      if (appStateTimeoutRef.current) {
        clearTimeout(appStateTimeoutRef.current);
        appStateTimeoutRef.current = null;
      }

      if (lowMemoryTimeoutRef.current) {
        clearTimeout(lowMemoryTimeoutRef.current);
        lowMemoryTimeoutRef.current = null;
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let backPressedOnce = false;

      const onBackPress = () => {
        if (backPressedOnce) {
          BackHandler.exitApp();
          return true;
        }

        backPressedOnce = true;

        if (Platform.OS === "android") {
          ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
        } else {
          Alert.alert("Exit App", "Press back again to exit");
        }

        setTimeout(() => {
          backPressedOnce = false;
        }, 2000);

        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [])
  );

  return {
    hasNotifications,
    showVideoFeed,
    showSkeletons,
    showError,
    scrollRef,
    isLowMemory, 
    flatListProps,
    handleFilterClose,
    setIsLowMemory,
    handleMomentumScrollEnd,
    handleScrollBeginDrag,
    handleScroll,
    handleScrollEndDrag,
    handleVideoPress,
    handleNotificationPress,
  };
};

export default useHomeScreenOptimization;
