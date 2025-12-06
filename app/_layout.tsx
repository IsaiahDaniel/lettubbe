import "react-native-reanimated";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  Roboto_100Thin,
  Roboto_300Light,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";

import * as Notifications from "expo-notifications";
import { router, useLocalSearchParams } from "expo-router";
import QueryProvider from "../providers/QueryProvider";

import { storeData } from "@/helpers/utils/storage";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/config/toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MenuProvider } from "react-native-popup-menu";
import { getSocket } from "@/helpers/utils/socket";
import useAuth from "@/hooks/auth/useAuth";
import { useGetUserIdState } from "@/store/UsersStore";
import { useGetVideoItemStore } from "@/store/feedStore";
import { ThemeProvider } from "@/components/ThemeProvider";
import { VideoTransitionProvider } from "@/contexts/VideoTransitionContext";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import AuthProvider from "@/contexts/AuthProvider";
import { devLog } from "@/config/dev";
import { AlertProvider } from "@/components/ui/AlertProvider";
import { useAppVersionCheck } from "@/hooks/useAppVersionCheck";
import UpdateModal from "@/components/shared/UpdateModal";
import { getIsProcessingDeepLink, initializeDeepLinking } from "@/helpers/utils/deepLinkUtils";
import { useAudioStore } from "@/store/audioStore";
import PhotoViewerModal from "@/components/shared/PhotoViewerModal";
import { HomeTabProvider } from "@/contexts/HomeTabContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function useNotificationObserver() {
  const { setSelectedItem } = useGetVideoItemStore();

  useEffect(() => {
    let isMounted = true;

    async function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      const conversationData = notification.request.content.data?.conversation;

      // Handle upload notification actions
      const notificationData = notification.request.content.data;
      if (notificationData?.type === 'upload_result') {
        // console.log('Upload notification clicked');
        // Just return to app for upload result notifications
        return;
      }

      // Log all notification data when clicked
      // console.log('NOTIFICATION CLICKED - Full Data:', JSON.stringify({
      //   content: notification.request.content,
      //   data: notification.request.content.data,
      //   title: notification.request.content.title,
      //   body: notification.request.content.body,
      //   url: url,
      //   identifier: notification.request.identifier,
      //   timestamp: new Date().toISOString()
      // }, null, 2));

      if (
        notification.request.content.data?.userDetails &&
        notification.request.content.data?.rideData
      ) {
        // Handle notification data storage here
      }

      // Handle chat notification navigation
      if (conversationData) {
        const conversationId = conversationData._id;
        const currentUserId = conversationData.receiver._id; // receiver is current user
        const otherUser = conversationData.sender._id === currentUserId ? conversationData.receiver : conversationData.sender;

        // Navigate to the specific chat conversation
        router.push(`/(chat)/${otherUser._id}/Inbox?username=${otherUser.username}&displayName=${otherUser.firstName} ${otherUser.lastName}&userId=${otherUser._id}&avatar=${otherUser.profilePicture}`);
      }
      // Handle like notification navigation
      else if (notification.request.content.title?.includes('liked your post') ||
        notification.request.content.body?.includes('Just liked your post')) {
        const postData = notification.request.content.data?.post || notification.request.content.data?.video;

        if (postData && postData._id) {
          // Navigate to video player with post ID
          router.push(`/(home)/VideoPlayer?videoId=${postData._id}&videoData=${encodeURIComponent(JSON.stringify(postData))}`);
        } else {
          // Fallback: navigate to home feed if no post data
          router.push('/(tabs)');
        }
      }
      // Handle mention notification navigation
      else if (notification.request.content.title?.includes('Mentioned in a post') ||
        notification.request.content.body?.includes('Mentioned you in a new post')) {
        const postData = notification.request.content.data?.post || notification.request.content.data?.video;
        const postId = notification.request.content.data?.postId || postData?._id;

        if (postId && postData) {
          // Determine if it's a photo or video post
          const isPhoto = postData.images && Array.isArray(postData.images) && postData.images.length > 0;
          const isVideo = postData.videoUrl;

          // Create media item for the store
          const mediaItem = {
            _id: postData._id,
            thumbnail: postData.thumbnail || (isPhoto ? postData.images[0] : null),
            duration: postData.duration?.toString() || "",
            description: postData.description || "",
            videoUrl: postData.videoUrl || "",
            photoUrl: isPhoto ? postData.images[0] : "",
            images: postData.images || [],
            mediaType: (isPhoto && !isVideo) ? 'photo' as const : 'video' as const,
            createdAt: postData.createdAt,
            comments: postData.comments || [],
            isCommentsAllowed: postData.isCommentsAllowed || true,
            reactions: {
              likes: postData.reactions?.likes || []
            },
            viewCount: postData.reactions?.totalViews || 0,
            commentCount: postData.comments?.length || 0,
            user: {
              username: postData.user?.username || "",
              subscribers: postData.user?.subscribers || [],
              _id: postData.user?._id || postData.user || "",
              firstName: postData.user?.firstName || "",
              lastName: postData.user?.lastName || "",
              profilePicture: postData.user?.profilePicture || ""
            }
          };

          // Set the selected item in the store
          setSelectedItem(mediaItem);

          if (isPhoto && !isVideo) {
            // Show photo viewer modal by setting store state
            // No need to navigate, the modal will show automatically
            router.push('/(tabs)');
          } else {
            // Navigate to video player for video posts
            router.push("/(home)/VideoPlayer");
          }
        } else {
          // Fallback: navigate to home feed if no post data
          router.push('/(tabs)');
        }
      }
      // Handle stream live notification navigation
      else if (notification.request.content.data?.stream) {
        const streamId = notification.request.content.data.stream;
        // console.log('🔴 STREAM NOTIFICATION: Navigating to live stream:', streamId);
        
        if (streamId && typeof streamId === 'string') {
          // Navigate to stream player (handles both live and upcoming streams)
          router.push(`/(streaming)/stream/${streamId}`);
        } else {
          // console.warn('🔴 STREAM NOTIFICATION: Invalid stream ID, falling back to streaming page');
          router.push('/(streaming)');
        }
      }
      else if (url) {
        router.push(url);
      }
    }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!isMounted || !response?.notification) {
        return;
      }
      redirect(response.notification);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        redirect(response.notification);
      }
    );

    Notifications.addNotificationReceivedListener((notification) => {
      devLog('GENERAL',
        "Notification received:",
        JSON.stringify(notification, null, 2)
      );
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}

const useGlobalSocket = () => {
  const { token: authToken, userDetails } = useAuth();

  // User ID management moved to AuthProvider to prevent race conditions

  useEffect(() => {
    if (!authToken || !userDetails?._id) return;

    const socket = getSocket(authToken);

    if (socket) {
      socket.on("connect", () => {
        devLog('SOCKET', "✅ Socket connected globally:", socket.id);
        socket.emit("register", userDetails._id);
      });

      socket.on("incomingCall", ({ fromUserId, callerName, tripId }: any) => {
        devLog('SOCKET', "Incoming call from", callerName);
        // Use the Zustand store directly instead of the hook
        useGetUserIdState.getState().setUserId(fromUserId);
      });

      socket.on("disconnect", () => {
        devLog('SOCKET', "❌ Socket disconnected globally");
      });
    }

    return () => {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
    };
  }, [authToken, userDetails?._id]);
};


function RootLayoutContent() {
  const { theme } = useCustomTheme();
  const { initializeAudioState } = useAudioStore();
  const params = useLocalSearchParams();

  // PhotoViewer modal state - controlled by store
  const { selectedItem } = useGetVideoItemStore();
  const showPhotoViewer = selectedItem?.mediaType === 'photo';
    
  const handleClosePhotoViewer = () => {
    // Clear the selected item to close modal
    const { setSelectedItem } = useGetVideoItemStore.getState();
    setSelectedItem(null);
  };

  useNotificationObserver();
  useGlobalSocket();

  // Initialize audio store on app start
  useEffect(() => {
    initializeAudioState();
  }, [initializeAudioState]);

  // Initialize deep linking system
  useEffect(() => {
    // console.log('🔗 LAYOUT: Initializing deep linking system');
    let deepLinkCleanup: (() => void) | null = null;
    
    try {
      deepLinkCleanup = initializeDeepLinking();
    } catch (error) {
      // console.error('🔗 LAYOUT: Failed to initialize deep linking:', error);
    }
    
    return () => {
      if (deepLinkCleanup) {
        // console.log('🔗 LAYOUT: Cleaning up deep linking system');
        try {
          deepLinkCleanup();
        } catch (error) {
          // console.error('🔗 LAYOUT: Error during deep linking cleanup:', error);
        }
      }
    };
  }, []);

  // Version check hook
  const {
    showUpdateModal,
    setShowUpdateModal,
    latestVersion,
    currentVersion,
    releaseNotes,
    isForced,
  } = useAppVersionCheck();

  // Load only critical fonts for startup
  const [criticalFontsLoaded] = useFonts({
    Roboto_400Regular, // Primary text
    Roboto_500Medium, // Headers and important text
  });

  // Load additional fonts in background after critical ones are ready
  const [additionalFontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "CarterOne-Regular": require("../assets/fonts/CarterOne-Regular.ttf"),
    Roboto_100Thin,
    Roboto_300Light,
    Roboto_700Bold,
    Roboto_900Black,
  });

  // Hide splash screen as soon as critical fonts are loaded
  useEffect(() => {
    if (criticalFontsLoaded && !getIsProcessingDeepLink()) {
      devLog('FONT', 'Critical fonts loaded - hiding splash screen for fast startup');
      SplashScreen.hideAsync();
    }
  }, [criticalFontsLoaded]);

  // Monitor deep link processing completion
  useEffect(() => {
    if (!criticalFontsLoaded) return;

    const checkDeepLinkCompletion = setInterval(() => {
      if (!getIsProcessingDeepLink()) {
        devLog('FONT', 'Deep link processing completed - hiding splash screen');
        SplashScreen.hideAsync();
        clearInterval(checkDeepLinkCompletion);
      }
    }, 100);

    return () => clearInterval(checkDeepLinkCompletion);
  }, [criticalFontsLoaded]);

  if (!criticalFontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
        <QueryProvider>
          <AlertProvider>
            <MenuProvider>
              <VideoTransitionProvider>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(personalization)" options={{ headerShown: false }} />
                  <Stack.Screen name="(explore)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="(home)"
                    options={{
                      headerShown: false,
                      animation: 'none',
                      gestureEnabled: false,
                    }}
                  />
                  <Stack.Screen name="(profile)" options={{ headerShown: false }} />
                  <Stack.Screen name="(videoUploader)" options={{ headerShown: false }} />
                  <Stack.Screen name="(chat)" options={{ headerShown: false }} />
                  <Stack.Screen name="(community)" options={{ headerShown: false }} />
                  <Stack.Screen name="(calls)" options={{ headerShown: false }} />
                  <Stack.Screen name="(posts)" options={{ headerShown: false }} />
                  <Stack.Screen name="(settings)" options={{ headerShown: false }} />
                  <Stack.Screen name="(streaming)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                  <Stack.Screen name="photo/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="video/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="community/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="stream/[id]" options={{ headerShown: false }} />
                </Stack>
              </VideoTransitionProvider>
            </MenuProvider>

            {/* Update Modal */}
            <UpdateModal
              isVisible={showUpdateModal}
              onClose={() => setShowUpdateModal(false)}
              latestVersion={latestVersion || ""}
              currentVersion={currentVersion}
              releaseNotes={releaseNotes || ""}
              isForced={isForced}
            />
            
            {/* Global PhotoViewer Modal - controlled by URL params */}
            <PhotoViewerModal
              visible={showPhotoViewer}
              onClose={handleClosePhotoViewer}
            />
          </AlertProvider>
          <Toast config={toastConfig} />
          <StatusBar style={theme === "dark" ? "light" : "dark"} />
        </QueryProvider>
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  // Configure notification behavior
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldShowAlert: true,
      shouldSetBadge: false,
    }),
  });

  // Set up Android notification channel immediately
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C"
    });
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <HomeTabProvider>
          <RootLayoutContent />
        </HomeTabProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}