import { useState } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import usePermissions from './usePermissions';
import showToast from '@/helpers/utils/showToast';

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  filename?: string;
}

export const useMediaDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { hasVideoPermission, requestVideoPermission } = usePermissions();

  const ensureMediaLibraryPermission = async (): Promise<boolean> => {
    // Check if we already have permission
    if (hasVideoPermission) {
      return true;
    }

    // Request permission if we don't have it
    const granted = await requestVideoPermission();
    if (!granted) {
      showToast('error', 'Media library permission is required to save media');
      return false;
    }

    return true;
  };

  const getFileExtension = (uri: string, type: 'image' | 'video'): string => {
    const extension = uri.split('.').pop()?.toLowerCase();
    if (extension && ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi'].includes(extension)) {
      return extension;
    }
    return type === 'image' ? 'jpg' : 'mp4';
  };

  const generateFilename = (type: 'image' | 'video'): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = type === 'image' ? 'jpg' : 'mp4';
    return `lettubbe_${type}_${timestamp}.${extension}`;
  };

  const downloadAndSaveMedia = async (mediaItem: MediaItem): Promise<boolean> => {
    try {
      setIsDownloading(true);

      // Check permissions first
      const hasPermission = await ensureMediaLibraryPermission();
      if (!hasPermission) {
        return false;
      }

      let localUri = mediaItem.uri;

      // If it's a remote URL, download it first
      if (mediaItem.uri.startsWith('http')) {
        const extension = getFileExtension(mediaItem.uri, mediaItem.type);
        const filename = mediaItem.filename || generateFilename(mediaItem.type);
        const downloadPath = `${FileSystem.documentDirectory}${filename}`;

        showToast('success', `Downloading ${mediaItem.type}...`);

        const downloadResult = await FileSystem.downloadAsync(mediaItem.uri, downloadPath);
        if (downloadResult.status !== 200) {
          throw new Error(`Download failed with status: ${downloadResult.status}`);
        }
        localUri = downloadResult.uri;
      }

      // Save to media library first to get the asset
      const asset = await MediaLibrary.createAssetAsync(localUri);
      
      // Get or create the Lettubbe album
      let album = await MediaLibrary.getAlbumAsync('Lettubbe');
      if (!album) {
        album = await MediaLibrary.createAlbumAsync('Lettubbe', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      
      showToast('success', `${mediaItem.type === 'image' ? 'Photo' : 'Video'} saved to gallery`);
      return true;

    } catch (error) {
      console.error('Error saving media:', error);
      showToast('error', `Failed to save ${mediaItem.type}`);
      return false;
    } finally {
      setIsDownloading(false);
    }
  };

  const saveImage = async (uri: string, filename?: string): Promise<boolean> => {
    return downloadAndSaveMedia({
      uri,
      type: 'image',
      filename
    });
  };

  const saveVideo = async (uri: string, filename?: string): Promise<boolean> => {
    return downloadAndSaveMedia({
      uri,
      type: 'video',
      filename
    });
  };

  return {
    isDownloading,
    saveImage,
    saveVideo,
    downloadAndSaveMedia
  };
};