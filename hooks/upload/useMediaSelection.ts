import { useState, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import { getFileSize, formatFileSize, MAX_TOTAL_SIZE_BYTES, MAX_TOTAL_SIZE_MB } from '@/helpers/utils/media-utils';

interface UseMediaSelectionProps {
  uploadMode: "video" | "photo" | "document" | "audio";
  maxSelections?: number;
}

export const useMediaSelection = ({ 
  uploadMode, 
  maxSelections = 30 
}: UseMediaSelectionProps) => {
  const { showError } = useCustomAlert();
  const [selectedMedia, setSelectedMedia] = useState<MediaLibrary.Asset[]>([]);
  const [selectedMediaSizes, setSelectedMediaSizes] = useState<{[key: string]: number}>({});

  /**
   * Get total size of all selected media
   */
  const getTotalSelectedSize = useCallback((): number => {
    return Object.values(selectedMediaSizes).reduce((total, size) => total + size, 0);
  }, [selectedMediaSizes]);

  /**
   * Check if media is currently selected
   */
  const isMediaSelected = useCallback((mediaId: string): boolean => {
    return selectedMedia.some(item => item.id === mediaId);
  }, [selectedMedia]);

  /**
   * Get selection number for a media item (1-based index)
   */
  const getSelectionNumber = useCallback((mediaId: string): number => {
    const index = selectedMedia.findIndex(item => item.id === mediaId);
    return index >= 0 ? index + 1 : 0;
  }, [selectedMedia]);

  /**
   * Toggle selection of a media item with size validation
   */
  const toggleMediaSelection = useCallback(async (mediaAsset: MediaLibrary.Asset): Promise<boolean> => {
    const isSelected = isMediaSelected(mediaAsset.id);
    
    if (isSelected) {
      // Remove from selection
      setSelectedMedia(prev => prev.filter(item => item.id !== mediaAsset.id));
      setSelectedMediaSizes(prev => {
        const newSizes = { ...prev };
        delete newSizes[mediaAsset.id];
        return newSizes;
      });
      return true;
    }

    // Check selection limit
    if (selectedMedia.length >= maxSelections) {
      showError('Selection Limit', `You can select up to ${maxSelections} files.`);
      return false;
    }

    // Check file size for new selection
    const fileSize = await getFileSize(mediaAsset.uri);
    const currentTotalSize = getTotalSelectedSize();
    const newTotalSize = currentTotalSize + fileSize;
    
    if (newTotalSize > MAX_TOTAL_SIZE_BYTES) {
      const remainingSize = MAX_TOTAL_SIZE_BYTES - currentTotalSize;
      showError(
        'File Size Limit Exceeded',
        `File size: ${formatFileSize(fileSize)}\nRemaining space: ${formatFileSize(remainingSize)}\nTotal limit: ${MAX_TOTAL_SIZE_MB}MB`
      );
      return false;
    }

    // Add to selection
    setSelectedMedia(prev => [...prev, mediaAsset]);
    setSelectedMediaSizes(prev => ({ ...prev, [mediaAsset.id]: fileSize }));
    return true;
  }, [selectedMedia, maxSelections, isMediaSelected, getTotalSelectedSize, showError]);

  /**
   * Clear all selections
   */
  const clearSelections = useCallback(() => {
    setSelectedMedia([]);
    setSelectedMediaSizes({});
  }, []);

  /**
   * Set selected media (for single selection modes like video)
   */
  const setSelectedMediaDirect = useCallback((media: MediaLibrary.Asset[]) => {
    setSelectedMedia(media);
  }, []);

  /**
   * Add media to selection without size check (for pre-validated selections)
   */
  const addToSelection = useCallback(async (mediaAsset: MediaLibrary.Asset) => {
    if (!isMediaSelected(mediaAsset.id)) {
      const fileSize = await getFileSize(mediaAsset.uri);
      setSelectedMedia(prev => [...prev, mediaAsset]);
      setSelectedMediaSizes(prev => ({ ...prev, [mediaAsset.id]: fileSize }));
    }
  }, [isMediaSelected]);

  return {
    // State
    selectedMedia,
    selectedMediaSizes,
    
    // Computed values
    selectionCount: selectedMedia.length,
    totalSize: getTotalSelectedSize(),
    
    // Selection methods
    isMediaSelected,
    getSelectionNumber,
    toggleMediaSelection,
    clearSelections,
    setSelectedMediaDirect,
    addToSelection,
    
    // Utilities
    getTotalSelectedSize,
  };
};