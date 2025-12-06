import { useEffect, useState } from 'react';
import { View, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Icons } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Logo from '../../assets/images/lettubbe-logo.svg';

export default function PhotoDeepLink() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [navigationReady, setNavigationReady] = useState(false);
  const { theme } = useCustomTheme();
  
  // Wait for navigation stack to be ready
  useEffect(() => {
    const checkNavigationReady = () => {
      try {
        // Test if router is ready by checking if it can access current state
        if (router && typeof router.replace === 'function') {
          console.log('📸 PHOTO_DEEPLINK: Navigation stack is ready');
          setNavigationReady(true);
          return true;
        }
      } catch (error) {
        console.log('📸 PHOTO_DEEPLINK: Navigation not ready yet:', error);
      }
      return false;
    };

    // Immediate check
    if (checkNavigationReady()) return;

    // Retry every 100ms until ready (max 5 seconds)
    let attempts = 0;
    const maxAttempts = 50;
    
    const interval = setInterval(() => {
      attempts++;
      if (checkNavigationReady() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.log('📸 PHOTO_DEEPLINK: Navigation readiness timeout, proceeding anyway');
          setNavigationReady(true);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);
  
  // Navigate once navigation is ready
  useEffect(() => {
    if (!navigationReady) return;
    
    if (!id) {
      console.log('📸 PHOTO_DEEPLINK: No ID provided, redirecting to home');
      router.replace('/(tabs)');
      return;
    }
    
    console.log('📸 PHOTO_DEEPLINK: Navigation ready, redirecting to PhotoViewer with postId:', id);
    // Direct redirect to PhotoViewer - it handles its own loading state
    router.replace(`/(home)/PhotoViewer?postId=${id}`);
  }, [id, navigationReady]);
  
  // Show splash screen while waiting for navigation to be ready
  return (
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
  );
}