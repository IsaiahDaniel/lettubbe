import { useState, useRef, useEffect, useCallback } from 'react';
import { Animated, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { State } from 'react-native-gesture-handler';
import { CHAT_CONSTANTS } from '@/constants/chat.constants';
import type { HeaderTab, ChatFilterTab } from '@/constants/chat.constants';

export const useTabNavigation = () => {
  const params = useLocalSearchParams();
  const screenWidth = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(0)).current;
  
  const [activeTab, setActiveTab] = useState<ChatFilterTab>("All");
  const [activeHeaderTab, setActiveHeaderTab] = useState<HeaderTab>(
    params.tab === "communities" ? "Communities" : "Inbox"
  );

  // Handle tab parameter from URL and sync animation
  useEffect(() => {
    if (params.tab === "communities") {
      setActiveHeaderTab("Communities");
      translateX.setValue(-screenWidth);
    } else {
      translateX.setValue(0);
    }
  }, [params.tab, screenWidth]);

  const handleHeaderTabPress = (tab: HeaderTab) => {
    const targetValue = tab === "Inbox" ? 0 : -screenWidth;
    
    Animated.timing(translateX, {
      toValue: targetValue,
      duration: CHAT_CONSTANTS.ANIMATION.DURATION,
      useNativeDriver: true,
    }).start();
    
    setActiveHeaderTab(tab);
  };

  // Handle real-time gesture updates
  const handleGestureEvent = useCallback((event: any) => {
    const { translationX, translationY } = event.nativeEvent;
    
    // Only handle horizontal swipes
    if (Math.abs(translationY) > CHAT_CONSTANTS.GESTURES.VERTICAL_THRESHOLD) return;
    
    // Get current position based on active tab
    const basePosition = activeHeaderTab === "Inbox" ? 0 : -screenWidth;
    
    // Calculate new position with constraints
    const newTranslateX = Math.max(-screenWidth, Math.min(0, basePosition + translationX));
    
    translateX.setValue(newTranslateX);
  }, [activeHeaderTab, screenWidth, translateX]);

  const snapBackToCurrentTab = useCallback(() => {
    const targetValue = activeHeaderTab === "Inbox" ? 0 : -screenWidth;
    Animated.spring(translateX, {
      toValue: targetValue,
      useNativeDriver: true,
      tension: CHAT_CONSTANTS.ANIMATION.SPRING_TENSION,
      friction: CHAT_CONSTANTS.ANIMATION.SPRING_FRICTION,
    }).start();
  }, [activeHeaderTab, screenWidth, translateX]);

  // Handle gesture state changes (start/end)
  const handleSwipe = useCallback((event: any) => {
    const { translationX, translationY, state, velocityX } = event.nativeEvent;
    
    // Only handle horizontal swipes
    if (Math.abs(translationY) > CHAT_CONSTANTS.GESTURES.VERTICAL_THRESHOLD) return;
    
    if (state === State.END || state === State.CANCELLED) {
      const swipeThreshold = screenWidth * CHAT_CONSTANTS.GESTURES.SWIPE_THRESHOLD;
      const shouldSwitch = Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > CHAT_CONSTANTS.GESTURES.VELOCITY_THRESHOLD;
      
      if (shouldSwitch) {
        if (translationX > 0 && activeHeaderTab === "Communities") {
          // Swipe right from Communities to Inbox
          handleHeaderTabPress("Inbox");
        } else if (translationX < 0 && activeHeaderTab === "Inbox") {
          // Swipe left from Inbox to Communities
          handleHeaderTabPress("Communities");
        } else {
          // Snap back to current tab
          snapBackToCurrentTab();
        }
      } else {
        // Snap back to current tab
        snapBackToCurrentTab();
      }
    }
  }, [activeHeaderTab, screenWidth, handleHeaderTabPress, snapBackToCurrentTab]);

  return {
    activeTab,
    setActiveTab,
    activeHeaderTab,
    handleHeaderTabPress,
    handleGestureEvent,
    handleSwipe,
    translateX,
    screenWidth,
  };
};