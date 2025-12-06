import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react';

interface HomeTabContextType {
  scrollToTopAndRefresh: () => void;
  setScrollToTopAndRefresh: (fn: () => void) => void;
  pauseBackgroundAutoplay: () => void;
  resumeBackgroundAutoplay: () => void;
  setPauseBackgroundAutoplay: (fn: () => void) => void;
  setResumeBackgroundAutoplay: (fn: () => void) => void;
}

const HomeTabContext = createContext<HomeTabContextType | undefined>(undefined);

export const HomeTabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scrollToTopAndRefreshRef = useRef<(() => void) | null>(null);
  const pauseBackgroundAutoplayRef = useRef<(() => void) | null>(null);
  const resumeBackgroundAutoplayRef = useRef<(() => void) | null>(null);

  const setScrollToTopAndRefresh = useCallback((fn: () => void) => {
    scrollToTopAndRefreshRef.current = fn;
  }, []);

  const scrollToTopAndRefresh = useCallback(() => {
    if (scrollToTopAndRefreshRef.current) {
      scrollToTopAndRefreshRef.current();
    }
  }, []);

  const setPauseBackgroundAutoplay = useCallback((fn: () => void) => {
    pauseBackgroundAutoplayRef.current = fn;
  }, []);

  const pauseBackgroundAutoplay = useCallback(() => {
    if (pauseBackgroundAutoplayRef.current) {
      pauseBackgroundAutoplayRef.current();
    }
  }, []);

  const setResumeBackgroundAutoplay = useCallback((fn: () => void) => {
    resumeBackgroundAutoplayRef.current = fn;
  }, []);

  const resumeBackgroundAutoplay = useCallback(() => {
    if (resumeBackgroundAutoplayRef.current) {
      resumeBackgroundAutoplayRef.current();
    }
  }, []);

  const contextValue = useMemo(() => ({
    scrollToTopAndRefresh, 
    setScrollToTopAndRefresh,
    pauseBackgroundAutoplay,
    resumeBackgroundAutoplay,
    setPauseBackgroundAutoplay,
    setResumeBackgroundAutoplay
  }), [
    scrollToTopAndRefresh,
    setScrollToTopAndRefresh,
    pauseBackgroundAutoplay,
    resumeBackgroundAutoplay,
    setPauseBackgroundAutoplay,
    setResumeBackgroundAutoplay
  ]);

  return (
    <HomeTabContext.Provider value={contextValue}>
      {children}
    </HomeTabContext.Provider>
  );
};

export const useHomeTab = () => {
  const context = useContext(HomeTabContext);
  if (context === undefined) {
    throw new Error('useHomeTab must be used within a HomeTabProvider');
  }
  return context;
};

// Safe version that doesn't throw error when provider is missing
export const useHomeTabSafe = () => {
  const context = useContext(HomeTabContext);
  return context; // Can be undefined
};