import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface ThumbnailPickerResult {
  success: boolean;
  uri?: string;
  error?: string;
}

//Goal ➝ Handle thumbnail image selection with proper permissions

export class ThumbnailService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          'Please grant camera roll permissions to upload a thumbnail'
        );
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  static async pickThumbnail(): Promise<ThumbnailPickerResult> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return { 
          success: false, 
          error: 'Camera roll permission denied' 
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { 
          success: false, 
          error: 'Image selection cancelled' 
        };
      }

      return {
        success: true,
        uri: result.assets[0].uri,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to select image. Please try again.',
      };
    }
  }
}