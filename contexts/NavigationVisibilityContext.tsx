import React, { createContext, useContext, useRef, useCallback, useState } from 'react';
import { Animated } from 'react-native';

interface NavigationVisibilityContextType {
  isNavVisible: boolean;
  showNavigation: () => void;
  hideNavigation: () => void;
  navVisibilityValue: Animated.Value;
  headerVisibilityValue: Animated.Value;
}

const NavigationVisibilityContext = createContext<NavigationVisibilityContextType | undefined>(undefined);

interface NavigationVisibilityProviderProps {
  children: React.ReactNode;
}

export const NavigationVisibilityProvider: React.FC<NavigationVisibilityProviderProps> = ({ children }) => {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const navVisibilityValue = useRef(new Animated.Value(1)).current;
  const headerVisibilityValue = useRef(new Animated.Value(1)).current;
  const animatingRef = useRef(false);

  const showNavigation = useCallback(() => {
    if (!isNavVisible && !animatingRef.current) {
      animatingRef.current = true;
      setIsNavVisible(true);
      Animated.parallel([
        Animated.spring(navVisibilityValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 7,
        }),
        Animated.timing(headerVisibilityValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        animatingRef.current = false;
      });
    }
  }, [navVisibilityValue, headerVisibilityValue, isNavVisible]);

  const hideNavigation = useCallback(() => {
    if (isNavVisible && !animatingRef.current) {
      animatingRef.current = true;
      setIsNavVisible(false);
      Animated.parallel([
        Animated.spring(navVisibilityValue, {
          toValue: 0,
          useNativeDriver: true,
          tension: 120,
          friction: 7,
        }),
        Animated.timing(headerVisibilityValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        animatingRef.current = false;
      });
    }
  }, [navVisibilityValue, headerVisibilityValue, isNavVisible]);

  const value = {
    isNavVisible,
    showNavigation,
    hideNavigation,
    navVisibilityValue,
    headerVisibilityValue,
  };

  return (
    <NavigationVisibilityContext.Provider value={value}>
      {children}
    </NavigationVisibilityContext.Provider>
  );
};

export const useNavigationVisibility = () => {
  const context = useContext(NavigationVisibilityContext);
  if (context === undefined) {
    throw new Error('useNavigationVisibility must be used within a NavigationVisibilityProvider');
  }
  return context;
};