import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { gracefulDisconnect, cancelGracefulDisconnect, forceReconnect } from '@/helpers/utils/socket';

/**
 * Hook to manage socket connections based on app lifecycle events
 * Handles graceful disconnection when app goes to background and reconnection when returning
 */
export const useSocketLifecycle = () => {
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log(`📱 App state changed: ${appState.current} -> ${nextAppState}`);

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        console.log('🌟 App returned to foreground');
        
        // Cancel any scheduled disconnections
        cancelGracefulDisconnect();
        
        // If app was in background for more than 30 seconds, force reconnect
        if (backgroundTime.current && Date.now() - backgroundTime.current > 30000) {
          console.log('🔄 App was in background for >30s, forcing reconnect');
          forceReconnect();
        }
        
        backgroundTime.current = null;
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        console.log('🌙 App went to background');
        backgroundTime.current = Date.now();
        
        // Schedule graceful disconnect after 10 seconds in background
        gracefulDisconnect(10000);
      }

      appState.current = nextAppState;
    };

    // Subscribe to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // Cleanup
      if (subscription) {
        subscription.remove();
      }
      
      // Cancel any pending disconnections
      cancelGracefulDisconnect();
    };
  }, []);

  return {
    currentAppState: appState.current,
  };
};

export default useSocketLifecycle;