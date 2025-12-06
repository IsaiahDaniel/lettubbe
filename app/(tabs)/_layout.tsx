import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import { Image, Platform, View } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { Colors } from "@/constants/Colors";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import RemixIcon from "react-native-remix-icon";
import { Icons, Images } from "@/constants";
import useVideoUploadStore from "@/store/videoUploadStore";
import { Feather } from "@expo/vector-icons";
import Avatar from "@/components/ui/Avatar";
import useAuth from "@/hooks/auth/useAuth";
import VideoUploadModal from "@/components/shared/videoUpload/VideoUploadModal";
import DynamicIslandTabBar from "@/components/ui/DynamicIslandTabBar";
import { NavigationVisibilityProvider } from "@/contexts/NavigationVisibilityContext";

export default function TabLayout() {
  // console.log('🏗️ TabLayout: Re-rendering at', performance.now());
  const { theme } = useCustomTheme();
  const openUploadModal = useVideoUploadStore(state => state.openUploadModal);
  const { userDetails } = useAuth();

  // Memoize profile pic to prevent re-renders
  const profilePic = useMemo(() => {
    return userDetails?.profilePicture
      ? { uri: userDetails.profilePicture }
      : Images.avatar;
  }, [userDetails?.profilePicture]);


  return (
    <NavigationVisibilityProvider>
        <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: false,
          tabBarStyle: {
            display: 'none', // Hide default tab bar
          },
          freezeOnBlur: true, // Prevent unmounting when tab is not focused
          lazy: false, // Don't lazy load tabs
        }}
        tabBar={(props) => <DynamicIslandTabBar {...props} />}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <RemixIcon
                size={28}
                name={focused ? "home-5-fill" : "home-5-line"}
                color={Colors[theme].textBold}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ focused }) => (
              <RemixIcon
                size={28}
                name={focused ? "compass-3-fill" : "compass-3-line"}
                color={Colors[theme].textBold}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="post"
          // This screen won't actually render
          listeners={{
            tabPress: (e) => {
              // Prevent navigation to the post screen
              e.preventDefault();
              // Instead, open the upload modal
              openUploadModal();
            },
          }}
          options={{
            title: "Post",
            tabBarIcon: ({ }) => (
              <Image
                source={Icons.post}
                style={{
                  width: 40,
                  height: 40,
                  resizeMode: "contain",
                }}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ focused }) => (
              <RemixIcon
                size={28}
                name={focused ? "question-answer-fill" : "question-answer-line"}
                color={Colors[theme].textBold}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <Avatar
                imageSource={profilePic}
                size={32}
                uri
                ringColor={Colors[theme].cardBackground}
                expandable={false}
              />
            ),
          }}
        />
        </Tabs>
        <VideoUploadModal />
      </NavigationVisibilityProvider>
  );
}
