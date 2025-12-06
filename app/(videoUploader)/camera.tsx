import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import useVideoUploadStore from '@/store/videoUploadStore';
import { useRouter } from 'expo-router';
import CameraScreen from '@/components/shared/videoUpload/CameraScreen';

const CameraPage = () => {
  const router = useRouter();
  const { shouldNavigateToEditor, resetNavigation } = useVideoUploadStore();

  useEffect(() => {
    // If the shouldNavigateToEditor flag is set, navigate to the editor screen
    if (shouldNavigateToEditor) {
      // Reset the navigation flag first
      resetNavigation();
      
      // Navigate to video editor
      router.replace('/(videoUploader)/videoEditor');
    }
  }, [shouldNavigateToEditor, resetNavigation, router]);

  // Cleanup navigation flag when component unmounts
  useEffect(() => {
    return () => {
      resetNavigation();
    };
  }, [resetNavigation]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <CameraScreen />
    </SafeAreaView>
  );
};

export default CameraPage;