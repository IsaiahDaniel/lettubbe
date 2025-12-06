import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhotoCameraScreen from '@/components/shared/videoUpload/PhotoCameraScreen';

const PhotoCameraPage = () => {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <PhotoCameraScreen />
    </SafeAreaView>
  );
};

export default PhotoCameraPage;