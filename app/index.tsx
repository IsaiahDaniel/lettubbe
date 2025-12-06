import React, { useEffect, useState, useRef } from "react";
import { Image, View } from "react-native";
import { getData, storeData, removeData } from "../helpers/utils/storage";
import { useRouter } from "expo-router";
import useAuth from "../hooks/auth/useAuth";
import { useAuthContext } from "@/contexts/AuthProvider";
import useUser from "../hooks/profile/useUser";
import { ONBOARDING_TYPE } from "@/helpers/enums/onboardingEnums";
import { Colors, Icons } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import Logo from "../assets/images/lettubbe-logo.svg";
import useGetPushToken from "@/hooks/notifications/useGetPushToken";
import usePushNotifications from "@/hooks/notifications/usePushNotifications";
import { getSignupState, getSignupNavigationPath, getSignupNavigationParams } from "@/helpers/utils/signupState";
import NetworkError from "@/components/shared/NetworkError";
import { getIsProcessingDeepLink } from "@/helpers/utils/deepLinkUtils";
import DeepLinkErrorBoundary from "@/components/shared/error/DeepLinkErrorBoundary";

const Landing = () => {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isLoading, setLoading] = useState(true);
  
  // ref-based navigation guard (no persistence to avoid session conflicts)
  const hasNavigatedRef = useRef(false);
  
  // Use AuthProvider for centralized auth state
  const { token, userDetails, isLoading: authLoading } = useAuthContext();
  const { profileData, profileLoading, profileError, profileErrorDetails, refetchProfile } = useUser();
  const { theme } = useCustomTheme();
  const { expoPushToken } = usePushNotifications();
  const { isSuccess } = useGetPushToken(expoPushToken?.data as any);

  const router = useRouter();


  const checkOnboardingStatus = async () => {
    try {
      setLoading(true);
      
      // Parallel reads for better performance
      const [isUserOnboarded, hasSeenOnboardingData] = await Promise.all([
        getData("isUserOnboarded"),
        getData(ONBOARDING_TYPE.HAS_SEEN_ONBOARDING)
      ]);

      setIsOnboarded(!!isUserOnboarded);
      setHasSeenOnboarding(!!hasSeenOnboardingData);
    } catch (error) {
      // console.error("Error checking onboarding status:", error);
      setIsOnboarded(false);
      setHasSeenOnboarding(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    // console.log('🏠 INDEX: useEffect triggered', {
    //   authLoading,
    //   isLoading,
    //   hasNavigated: hasNavigatedRef.current,
    //   isOnboarded,
    //   hasSeenOnboarding,
    //   deepLinkProcessing: getIsProcessingDeepLink()
    // });

    // Wait for both auth and onboarding data to load
    if (authLoading || isLoading || hasNavigatedRef.current || isOnboarded === null || hasSeenOnboarding === null) {
      // console.log('🏠 INDEX: Waiting for data to load or navigation already completed, returning early');
      return;
    }
    
    // Check if deep link is being processed BEFORE any navigation logic
    if (getIsProcessingDeepLink()) {
      // console.log('🏠 INDEX: Deep link is being processed, skipping normal navigation entirely');
      return;
    }
    
    // console.log('🏠 INDEX: All conditions met, proceeding with navigation');
    
    // Don't block on profile loading for better UX
    // Profile data can load in background while user accesses the app

    const navigate = async () => {
      // Prevent multiple calls by checking hasNavigated again inside function
      if (hasNavigatedRef.current) {
        // console.log('🏠 INDEX: Navigation already completed, skipping');
        return;
      }
      
      // console.log('🏠 INDEX: navigate function called', {
      //   authLoading,
      //   isLoading,
      //   hasNavigated: hasNavigatedRef.current,
      //   isOnboarded,
      //   hasSeenOnboarding,
      //   hasUserDetails: !!userDetails,
      //   hasToken: !!token
      // });
      
      // Double-check deep link status before proceeding
      if (getIsProcessingDeepLink()) {
        // console.log('🏠 INDEX: Deep link processing detected during navigation, aborting');
        return;
      }
      
      // console.log('🏠 INDEX: Setting hasNavigated to true');
      hasNavigatedRef.current = true;

      if (userDetails && token) {
        // console.log('🏠 INDEX: User authenticated, navigating to main app', {
        //   hasUserDetails: !!userDetails,
        //   hasToken: !!token,
        //   userId: userDetails?._id,
        //   hasProfileData: !!profileData
        // });
        
        // Only check for account deletion if we have profile data
        // If profile fetch failed due to network, still allow access to main app
        if (profileData?.data && (profileData.data as any)?.markedForDeletionDate) {
          // console.log('🏠 INDEX: Account marked for deletion, routing to grace period');
          router.replace("/(auth)/AccountDeletionGracePeriodWrapper");
          return;
        }
        
        // User is authenticated - go to main app regardless of profile fetch status
        // console.log('🏠 INDEX: Navigating to /(tabs) - main app');
        router.replace("/(tabs)");
        // console.log('🏠 INDEX: Navigation command executed');
        return;
      }

      // Check for incomplete signup state
      try {
        const signupState = await getSignupState();
        if (signupState && signupState.step !== 'completed') {
          const navigationPath = getSignupNavigationPath(signupState);
          const navigationParams = getSignupNavigationParams(signupState);
          
          if (Object.keys(navigationParams).length > 0) {
            router.replace({
              pathname: navigationPath as any,
              params: navigationParams,
            });
          } else {
            router.replace(navigationPath as any);
          }
          return;
        }
      } catch (error) {
        // console.error("Error retrieving signup state:", error);
        // Continue with normal flow if signup state check fails
      }

      if (isOnboarded || hasSeenOnboarding) {
        // User has been onboarded but not authenticated - go to login
        router.replace("/(auth)/LoginContent");
      } else {
        // User hasn't been onboarded - go to onboarding
        router.replace("/(onboarding)");
      }
    };

    // Navigate immediately when ready - no artificial delay
    // console.log('🏠 INDEX: Data ready, navigating immediately');
    navigate();
  }, [authLoading, isLoading, isOnboarded, hasSeenOnboarding]);

  // Handle post-authentication navigation
  useEffect(() => {
    // Only run if auth/onboarding data is loaded and we haven't navigated yet
    if (authLoading || isLoading || hasNavigatedRef.current || isOnboarded === null || hasSeenOnboarding === null) {
      return;
    }

    // If user becomes authenticated, navigate to main app
    if (userDetails && token) {
      // console.log('🏠 INDEX: Post-auth navigation - user authenticated, navigating to main app');
      hasNavigatedRef.current = true;
      
      // Check for account deletion
      if (profileData?.data && (profileData.data as any)?.markedForDeletionDate) {
        // console.log('🏠 INDEX: Account marked for deletion, routing to grace period');
        router.replace("/(auth)/AccountDeletionGracePeriodWrapper");
        return;
      }
      
      // console.log('🏠 INDEX: Navigating to main app after authentication');
      router.replace("/(tabs)");
    }
  }, [userDetails, token, authLoading, isLoading, isOnboarded, hasSeenOnboarding, profileData?.data, router]);

  // Cleanup no longer needed since removed the timeout

  // Remove this blocking network error - let individual screens handle network issues

  return (
    <DeepLinkErrorBoundary>
      <View style={{ 
        flex: 1, 
        alignItems: "center", 
        justifyContent: "center", 
        backgroundColor: Colors[theme].background 
      }}>
        <Logo width={121} height={100} />
        <Image 
          source={Icons.logoText} 
          style={{ 
            height: 69, 
            width: 209, 
            resizeMode: "contain", 
            marginTop: 26 
          }} 
          tintColor={Colors[theme].textBold} 
        />
      </View>
    </DeepLinkErrorBoundary>
  );
};

export default Landing;