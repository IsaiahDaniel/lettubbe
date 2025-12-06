import { useState, useRef, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';

type Album = {
  id: string;
  title: string;
  assetCount?: number;
  totalAssetCount?: number;
};

type UseMediaLibraryReturn = {
  albums: Album[];
  isLoading: boolean;
  error: string | null;
  fetchAlbums: (mediaType: 'video' | 'photo') => Promise<void>;
  clearError: () => void;
};

export const useMediaLibrary = (): UseMediaLibraryReturn => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for albums to prevent repeated fetches
  const albumCache = useRef<{ [key: string]: Album[] }>({});

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchAlbums = useCallback(async (mediaType: 'video' | 'photo') => {
    const cacheKey = mediaType;
    
    // Check cache first
    if (albumCache.current[cacheKey]) {
      setAlbums(albumCache.current[cacheKey]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission denied');
      }

      // Create a "Recents" pseudo-album (count will be determined lazily when needed)
      const recentsAlbum = { id: 'recents', title: 'Recents', assetCount: undefined };
      
      // Get albums efficiently - only what we need
      const albumsResult = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: false // Only real albums, skip smart albums
      });
      
      // Filter and validate albums for media content
      const mediaAlbums = [];
      
      // Exclude problematic system folders
      const excludedFolders = [
        'recently deleted',
        'hidden',
        'whatsapp audio',
        'whatsapp business audio',
        'ringtones'
      ];
      
      // Create batch requests
      const albumChecks = albumsResult
        .filter(album => !excludedFolders.includes(album.title.toLowerCase()))
        .map(async (album) => {
          try {
            // Only check for current media type to reduce API calls
            const mediaCheck = await MediaLibrary.getAssetsAsync({
              album: album.id,
              mediaType,
              first: 1
            });
            
            // Only return albums with content
            if (mediaCheck.totalCount > 0) {
              return {
                id: album.id,
                title: album.title,
                assetCount: mediaCheck.totalCount,
                totalAssetCount: mediaCheck.totalCount
              };
            }
            return null;
          } catch (error) {
            console.warn(`Error checking album ${album.title}:`, error);
            return null;
          }
        });
      
      // Execute all checks in parallel
      const results = await Promise.all(albumChecks);
      const validAlbums = results.filter(album => album !== null);
      
      // Add Recents as the first option, then other albums
      const finalAlbums = [recentsAlbum, ...validAlbums];
      
      // Cache the results
      albumCache.current[cacheKey] = finalAlbums;
      
      setAlbums(finalAlbums);
    } catch (error: any) {
      console.error('Error fetching albums:', error);
      setError(error.message || 'Failed to fetch albums');
      setAlbums([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    albums,
    isLoading,
    error,
    fetchAlbums,
    clearError,
  };
};