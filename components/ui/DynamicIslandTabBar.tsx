import React, { useEffect, useRef, useMemo } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RemixIcon from 'react-native-remix-icon';
import { Image } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Icons, Images } from '@/constants';
import useAuth from '@/hooks/auth/useAuth';
import useUser from '@/hooks/profile/useUser';
import useVideoUploadStore from '@/store/videoUploadStore';
import { useNavigationVisibility } from '@/contexts/NavigationVisibilityContext';
import { useHomeTab } from '@/contexts/HomeTabContext';
import useUnreadCount from '@/hooks/chats/useUnreadCount';
import Badge from './Badge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DynamicIslandTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const DynamicIslandTabBar: React.FC<DynamicIslandTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { theme } = useCustomTheme();
  const insets = useSafeAreaInsets();
  const { userDetails } = useAuth();
  const { profileData } = useUser();
  const { openUploadModal } = useVideoUploadStore();
  const { navVisibilityValue } = useNavigationVisibility();
  const { unreadCount } = useUnreadCount();
  const { scrollToTopAndRefresh } = useHomeTab();

  const profilePic = profileData?.data?.profilePicture
    ? { uri: profileData.data.profilePicture }
    : Images.avatar;

  // Create animated values for each tab route to avoid recreating on each render
  const tabAnimations = useMemo(() => {
    return state.routes.reduce((acc: { [key: string]: Animated.Value }, route: any) => {
      acc[route.key] = new Animated.Value(1);
      return acc;
    }, {});
  }, [state.routes]);


  const handleTabPress = (route: any, index: number) => {
    if (route.name === 'post') {
      openUploadModal();
    } else if (route.name === 'index' && state.index === index) {
      // Already on home screen, scroll to top and refresh
      scrollToTopAndRefresh();
    } else {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    }
  };

  const getTabIcon = useMemo(() => (routeName: string, isFocused: boolean) => {
    const iconColor = isFocused ? Colors.general.primary : Colors[theme].secondary;
    const avatarRingColor = isFocused ? Colors.general.primary : 'transparent';

    switch (routeName) {
      case 'index':
        return (
          <RemixIcon
            size={24}
            name={isFocused ? "home-5-fill" : "home-5-line"}
            color={iconColor}
          />
        );
      case 'explore':
        return (
          <RemixIcon
            size={24}
            name={isFocused ? "compass-3-fill" : "compass-3-line"}
            color={iconColor}
          />
        );
      case 'post':
        return (
          <View style={styles.postButtonContainer}>
            <RemixIcon
              size={40}
              name={"add-circle-line"}
              color={Colors.general.primary}
            />
            {/* <Image
              source={Icons.post}
              style={styles.postIcon}
            /> */}
          </View>
        );
      case 'chat':
        return (
          <View style={styles.chatIconContainer}>
            <RemixIcon
              size={24}
              name={isFocused ? "question-answer-fill" : "question-answer-line"}
              color={iconColor}
            />
            {unreadCount > 0 && <Badge count={unreadCount} />}
          </View>
        );
      case 'profile':
        return (
          <Avatar
            imageSource={profilePic}
            size={28}
            uri
            ringColor={avatarRingColor}
            ringThickness={2}
            expandable={false}
          />
        );
      default:
        return null;
    }
  }, [theme, profilePic]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 20,
          transform: [
            {
              translateY: navVisibilityValue.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              })
            },
            {
              scale: navVisibilityValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              })
            }
          ],
          opacity: navVisibilityValue,
        },
      ]}
    >
      <BlurView
        intensity={80}
        tint={theme === 'dark' ? 'dark' : 'light'}
        style={styles.blurContainer}
      >
        <View style={[
          styles.tabContainer,
          {
            backgroundColor: theme === 'dark'
              ? 'rgba(28, 28, 30, 0.8)'
              : 'rgba(255, 255, 255, 0.8)',
          }
        ]}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const scaleAnim = tabAnimations[route.key];

            const handlePressIn = () => {
              Animated.spring(scaleAnim, {
                toValue: 0.85,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
              }).start();
            };

            const handlePressOut = () => {
              Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
              }).start();
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => handleTabPress(route, index)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={[
                    styles.tabIconContainer,
                    {
                      transform: [{ scale: scaleAnim }],
                      backgroundColor: isFocused && route.name !== 'post' && route.name !== 'profile'
                        ? Colors.general.primary + '20'
                        : 'transparent',
                    },
                  ]}
                >
                  {getTabIcon(route.name, isFocused)}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  blurContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: SCREEN_WIDTH * 0.9,
    maxWidth: SCREEN_WIDTH * 0.9,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  chatIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DynamicIslandTabBar;