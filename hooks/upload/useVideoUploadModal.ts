import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import useVideoUploadStore from '@/store/videoUploadStore';
import useVideoPermissions from '@/hooks/usePermissions';
import { useMediaLibrary } from './useMediaLibrary';

type Album = {
  id: string;
  title: string;
  assetCount?: number;
  totalAssetCount?: number;
};

type UploadMode = 'video' | 'photo' | 'document' | 'audio';

export const useVideoUploadModal = () => {
  const router = useRouter();
  const { hasVideoPermission, requestVideoPermission } = useVideoPermissions();
  const { fetchAlbums: fetchMediaAlbums, albums: mediaAlbums, isLoading: isLoadingAlbums } = useMediaLibrary();
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isModalVisible,
    closeUploadModal,
    drafts,
    fetchDrafts,
    uploadMode,
    setUploadMode,
    isGalleryVisible,
    showGallery,
    hideGallery,
    isFolderSelectionVisible,
    showFolderSelection,
    hideFolderSelection,
    selectedAlbum,
    setSelectedAlbum,
    albums: storeAlbums,
    setAlbums: setStoreAlbums,
  } = useVideoUploadStore();

  const [hasDrafts, setHasDrafts] = useState(false);

  // Clean up any pending navigation timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const handleFetchAlbums = useCallback(async (uploadMode: UploadMode) => {
    try {
      // console.log('🎬 Fetching albums for:', uploadMode);
      // Only fetch albums for media types that support album browsing
      if (uploadMode === 'video' || uploadMode === 'photo') {
        await fetchMediaAlbums(uploadMode);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  }, [fetchMediaAlbums]);

  useEffect(() => {
    if (isModalVisible) {
      // Fetch drafts when modal becomes visible
      fetchDrafts().then(() => {
        const hasExistingDrafts = drafts.length > 0;
        setHasDrafts(hasExistingDrafts);
      });
    }
  }, [isModalVisible, drafts.length, fetchDrafts]);

  useEffect(() => {
    // Only fetch if gallery is visible, no album selected, and we have upload mode
    if (isGalleryVisible && !selectedAlbum && uploadMode) {
      handleFetchAlbums(uploadMode);
    }
  }, [isGalleryVisible, selectedAlbum, uploadMode, handleFetchAlbums]);

  // Sync media albums with store whenever they change
  useEffect(() => {
    if (mediaAlbums.length > 0) {
      // console.log('🎬 Syncing media albums to store, count:', mediaAlbums.length);
      setStoreAlbums(mediaAlbums);
      
      // Set first album as selected if none is selected
      if (!selectedAlbum) {
        // console.log('🎬 Setting selected album to:', mediaAlbums[0].title);
        setSelectedAlbum(mediaAlbums[0]);
      }
    }
  }, [mediaAlbums, selectedAlbum, setStoreAlbums, setSelectedAlbum]);

  const checkPermissionAndShowGallery = useCallback(async () => {
    if (!hasVideoPermission) {
      const granted = await requestVideoPermission();
      if (granted) {
        showGallery();
      } else {
        // Handle permission denied
        closeUploadModal();
      }
    } else {
      showGallery();
    }
  }, [hasVideoPermission, requestVideoPermission, showGallery, closeUploadModal]);

  const handleAlbumChange = useCallback((album: Album) => {
    setSelectedAlbum(album);
    hideFolderSelection();
  }, [setSelectedAlbum, hideFolderSelection]);

  const handleNewVideoPress = useCallback(async () => {
    // Clear previous state
    setSelectedAlbum(null);
    setStoreAlbums([]);
    
    setUploadMode("video");
    // Pre-load albums before showing gallery
    await handleFetchAlbums("video");
    checkPermissionAndShowGallery();
  }, [setUploadMode, handleFetchAlbums, checkPermissionAndShowGallery, setSelectedAlbum, setStoreAlbums]);

  const handleNewPhotoPress = useCallback(async () => {
    // Clear previous state
    setSelectedAlbum(null);
    setStoreAlbums([]);
    
    setUploadMode("photo");
    // Pre-load albums before showing gallery
    await handleFetchAlbums("photo");
    checkPermissionAndShowGallery();
  }, [setUploadMode, handleFetchAlbums, checkPermissionAndShowGallery, setSelectedAlbum, setStoreAlbums]);

  const handleDraftsPress = useCallback(() => {
    // Cancel any existing timeouts
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Close modal first
    closeUploadModal();

    // Navigate after a short delay
    navigationTimeoutRef.current = setTimeout(() => {
      router.push("/(videoUploader)/drafts");
    }, 100);
  }, [closeUploadModal, router]);

  const handleCloseModal = useCallback(() => {
    hideGallery();
    hideFolderSelection();
    setSelectedAlbum(null);
    closeUploadModal();
  }, [hideGallery, hideFolderSelection, setSelectedAlbum, closeUploadModal]);

  const handleGalleryClose = useCallback(() => {
    // Close the entire modal rather than just hiding gallery
    handleCloseModal();
  }, [handleCloseModal]);

  const handleAlbumSelectorPress = useCallback(() => {
    showFolderSelection();
  }, [showFolderSelection]);

  return {
    // State
    isModalVisible,
    isGalleryVisible,
    isFolderSelectionVisible,
    selectedAlbum,
    albums: storeAlbums,
    hasDrafts,
    uploadMode,
    isLoadingAlbums,
    
    // Actions
    handleNewVideoPress,
    handleNewPhotoPress,
    handleDraftsPress,
    handleCloseModal,
    handleGalleryClose,
    handleAlbumSelectorPress,
    handleAlbumChange,
    hideFolderSelection,
  };
};