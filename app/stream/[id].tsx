import React, { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

const StreamDeepLinkHandler = () => {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      // Redirect to the actual stream screen
      router.replace(`/(streaming)/stream/${id}`);
    } else {
      // Fallback to streaming index if no ID
      router.replace('/(streaming)');
    }
  }, [id]);

  return null; // This component doesn't render anything
};

export default StreamDeepLinkHandler;