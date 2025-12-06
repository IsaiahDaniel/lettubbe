import { useState, useEffect, useRef } from 'react';
import * as MediaLibrary from 'expo-media-library';

type Album = {
  id: string;
  title: string;
  assetCount?: number;
  totalAssetCount?: number;
};

interface UseMediaFetchingProps {
  selectedAlbum: Album | null;
  uploadMode: "video" | "photo" | "document" | "audio";
}

export const useMediaFetching = ({ selectedAlbum, uploadMode }: UseMediaFetchingProps) => {
  const [media, setMedia] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMedia, setHasMoreMedia] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  
  // Ref for debouncing load more requests
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMedia = async (album: Album, loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setMedia([]);
      setHasMoreMedia(true);
      setEndCursor(undefined);
    }

    try {
      if (!album) {
        setMedia([]);
        return;
      }

      const mediaType = uploadMode === "video" ? "video" : 
                        uploadMode === "audio" ? "audio" : 
                        uploadMode === "document" ? "photo" : "photo";
      const fetchLimit = loadMore ? 20 : 18; 
      const currentCursor = loadMore ? endCursor : undefined;

      let result;

      if (album.id === "recents") {
        result = await MediaLibrary.getAssetsAsync({
          mediaType,
          first: fetchLimit,
          after: currentCursor,
          sortBy: ["creationTime"],
        });
      } else {
        result = await MediaLibrary.getAssetsAsync({
          mediaType,
          album: album.id,
          first: fetchLimit,
          after: currentCursor,
          sortBy: ["creationTime"],
        });
      }

      const newAssets = result.assets;
      
      // Filter out invalid assets that could cause rendering issues
      const validAssets = newAssets.filter(asset => {
        if (!asset || !asset.id || !asset.uri) {
          console.warn('Filtered out invalid asset:', asset);
          return false;
        }
        return true;
      });

      if (loadMore) {
        setMedia((prevMedia) => [...prevMedia, ...validAssets]);
      } else {
        setMedia(validAssets);
      }

      setHasMoreMedia(result.hasNextPage);
      setEndCursor(result.endCursor);

      if (!loadMore) {
        console.log(`Loaded ${newAssets.length} ${mediaType}s from ${album.title}`);
      }
    } catch (error) {
      console.error(`Error fetching ${uploadMode}s from ${album?.title}:`, error);
      if (!loadMore) {
        setMedia([]);
      }
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleLoadMore = () => {
    if (selectedAlbum && hasMoreMedia && !loadingMore && !loading) {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }

      loadMoreTimeoutRef.current = setTimeout(() => {
        fetchMedia(selectedAlbum, true);
      }, 100);
    }
  };

  useEffect(() => {
    if (selectedAlbum) {
      fetchMedia(selectedAlbum, false);
    }
  }, [selectedAlbum, uploadMode]);

  useEffect(() => {
    return () => {
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, []);

  return {
    media,
    loading,
    loadingMore,
    hasMoreMedia,
    handleLoadMore,
    refetch: () => selectedAlbum && fetchMedia(selectedAlbum, false),
  };
};