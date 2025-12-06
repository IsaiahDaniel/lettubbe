import useVideoUploadStore, { Album } from "@/store/videoUploadStore";
import * as MediaLibrary from "expo-media-library";
import useVideoPermissions from "@/hooks/usePermissions";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useCallback } from "react";
import { useCustomTheme } from "../useCustomTheme";

// uploadMode = "video",
// setAlbums: any,
// albums: any,
// selectedAlbum: any,
// setSelectedAlbum: any,
// showGallery: any,
// hideFolderSelection: any,
// closeUploadModal: any

// Cache for processed albums to avoid re-processing
const albumCache = new Map<string, Album[]>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

const useAlbum = (uploadMode: string) => {
  const albumSelectorRef = useRef<View>(null);
  const isFetchingRef = useRef(false);
  const lastFetchedModeRef = useRef<string | null>(null);
  const { theme } = useCustomTheme();

  const {
    closeUploadModal,
    isGalleryVisible,
    hideGallery,
    showGallery,
    setUploadMode,
    isFolderSelectionVisible,
    showFolderSelection,
    hideFolderSelection,
    setisCommunityUpload,
    selectedAlbum,
    setSelectedAlbum,
    albums,
    setAlbums,
  } = useVideoUploadStore();
  const { hasVideoPermission, requestVideoPermission } = useVideoPermissions();

  const fetchAlbums = useCallback(async () => {
    try {
      console.log("🎯 [FETCH_ALBUMS] Called with uploadMode:", uploadMode, "isFetching:", isFetchingRef.current);
      
      // Prevent multiple simultaneous fetches
      if (isFetchingRef.current) {
        console.log("🎯 [FETCH_ALBUMS] Already fetching, skipping");
        return;
      }
      
      // Documents don't need media library permissions or albums
      if (uploadMode === "document") {
        console.log("Document mode - skipping album fetch");
        return;
      }
      
      // Check cache first
      const cacheKey = uploadMode;
      const cachedAlbums = albumCache.get(cacheKey);
      const cacheTime = cacheTimestamps.get(cacheKey);
      const isCacheValid = cacheTime && (Date.now() - cacheTime) < CACHE_DURATION;
      
      if (cachedAlbums && isCacheValid) {
        console.log("🚀 [FETCH_ALBUMS] Using cached albums for", uploadMode);
        setAlbums(cachedAlbums);
        lastFetchedModeRef.current = uploadMode;
        return;
      }
      
      // Check if we already have albums for this upload mode to avoid refetching
      const currentAlbums = useVideoUploadStore.getState().albums;
      if (currentAlbums && currentAlbums.length > 0 && lastFetchedModeRef.current === uploadMode) {
        console.log("🎯 [FETCH_ALBUMS] Albums already loaded for", uploadMode, ", skipping fetch");
        return;
      }
      
      isFetchingRef.current = true;

      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        console.error("Media library permission denied");
        return;
      }

      console.log("uploadMode album", uploadMode);

      // const { uploadMode } = useVideoUploadStore.getState();
      const mediaType = uploadMode === "video" ? "video" : uploadMode === "audio" ? "audio" : "photo";

      console.log("mediaType", mediaType);

      // Get total media count for "Recents"
      const recentMedia = await MediaLibrary.getAssetsAsync({
        mediaType,
        first: 0, // Get count only
      });

      // Also check for assets without specifying an album
      const allMedia = await MediaLibrary.getAssetsAsync({
        mediaType,
        first: 0, // Just get count
      });
      console.log(`Total ${mediaType}s in device: ${allMedia.totalCount}`);

      // Create a "Recents" pseudo-album with asset count (this shows all media sorted by recent)
      const recentsAlbum: Album = {
        id: "recents",
        title: "Recents",
        assetCount: recentMedia.totalCount,
        totalAssetCount: recentMedia.totalCount,
      };

      // Get actual albums (including smart albums to see all folders)
      const albumsResult = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });

      // Also try getting albums without smart albums restriction for comparison
      const regularAlbumsResult = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: false,
      });
      console.log(
        `Smart albums: ${albumsResult.length}, Regular albums: ${regularAlbumsResult.length}`
      );

      // Pre-filter and batch process albums
      console.log(`Found ${albumsResult.length} total albums/folders`);
      
      // Pre-filter albums by common patterns to reduce API calls
      const excludedFolders = ["recently deleted", "hidden"];
      const priorityAlbums: MediaLibrary.Album[] = []; // Common albums that likely have media
      const otherAlbums: MediaLibrary.Album[] = [];
      
      // Smart pre-filtering based on common album names
      for (const album of albumsResult) {
        const title = album.title.toLowerCase();
        
        if (excludedFolders.includes(title)) {
          continue;
        }
        
        // Prioritize albums that commonly contain media
        const isPriority = title.includes('camera') || 
                          title.includes('dcim') || 
                          title.includes('screenshot') || 
                          title.includes('whatsapp') || 
                          title === 'pictures' ||
                          title === 'downloads' ||
                          title.includes('instagram') ||
                          /^\d+$/.test(title); // Numeric folders (202401, etc.)
        
        if (isPriority) {
          priorityAlbums.push(album);
        } else {
          otherAlbums.push(album);
        }
      }
      
      console.log(`🚀 Pre-filtered: ${priorityAlbums.length} priority + ${otherAlbums.length} other albums`);
      
      // Process priority albums first with batch requests
      const processBatch = async (albums: typeof albumsResult, batchSize = 5): Promise<(Album | null)[]> => {
        const results: (Album | null)[] = [];
        
        for (let i = 0; i < albums.length; i += batchSize) {
          const batch = albums.slice(i, i + batchSize);
          
          const batchPromises = batch.map(async (album) => {
            try {
              const mediaCheck = await MediaLibrary.getAssetsAsync({
                album: album.id,
                mediaType,
                first: 1,
              });
              
              if (mediaCheck.totalCount > 0) {
                return {
                  id: album.id,
                  title: album.title,
                  assetCount: mediaCheck.totalCount,
                  totalAssetCount: mediaCheck.totalCount,
                } as Album;
              }
              return null;
            } catch (error) {
              console.warn(`Error checking album ${album.title}:`, error);
              return null;
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults.filter(Boolean));
          
          // Small delay between batches to prevent overwhelming the system
          if (i + batchSize < albums.length) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        
        return results;
      };
      
      // Process priority albums first
      const priorityResults = await processBatch(priorityAlbums, 8);
      console.log(`🚀 Found ${priorityResults.length} priority albums with ${mediaType}s`);
      
      const priorityMediaAlbums = priorityResults.filter((album): album is Album => album !== null);

      // Add Recents as the first option, then priority albums
      const initialAlbums = [recentsAlbum, ...priorityMediaAlbums];
      console.log(
        `🚀 Initial optimized folder list: ${priorityMediaAlbums.length} priority folders with ${mediaType}s`
      );
      
      // Set initial albums immediately for fast UI response
      setAlbums(initialAlbums);
      lastFetchedModeRef.current = uploadMode;
      
      // Lazy-load remaining albums in background if there are any
      if (otherAlbums.length > 0) {
        console.log(`🔄 Background loading ${otherAlbums.length} additional albums...`);
        
        // Process remaining albums in background with smaller batch size to avoid blocking
        setTimeout(async () => {
          try {
            const otherResults = await processBatch(otherAlbums, 4);
            const otherMediaAlbums = otherResults.filter((album): album is Album => album !== null);
            
            if (otherMediaAlbums.length > 0) {
              console.log(`🚀 Background loaded ${otherMediaAlbums.length} additional folders with ${mediaType}s`);
              
              // Combine priority and background-loaded albums
              const allAlbums = [recentsAlbum, ...priorityMediaAlbums, ...otherMediaAlbums];
              
              // Update cache and state with complete album list
              albumCache.set(uploadMode, allAlbums);
              cacheTimestamps.set(uploadMode, Date.now());
              
              // Only update if we're still in the same upload mode
              if (lastFetchedModeRef.current === uploadMode) {
                setAlbums(allAlbums);
                console.log(`✅ Complete folder list: ${allAlbums.length - 1} total folders loaded`);
              }
            } else {
              // Cache the initial albums if no additional ones were found
              albumCache.set(uploadMode, initialAlbums);
              cacheTimestamps.set(uploadMode, Date.now());
            }
          } catch (error) {
            console.warn("Error during background album loading:", error);
            // Cache the initial albums on error
            albumCache.set(uploadMode, initialAlbums);
            cacheTimestamps.set(uploadMode, Date.now());
          }
        }, 100); // Small delay to ensure UI responsiveness
      } else {
        // No additional albums to load, cache the initial results
        albumCache.set(uploadMode, initialAlbums);
        cacheTimestamps.set(uploadMode, Date.now());
      }
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      isFetchingRef.current = false;
      console.log("🎯 [FETCH_ALBUMS] Fetch completed, resetting flag");
    }
  }, [uploadMode, setAlbums, setSelectedAlbum]);

  const checkPermissionAndShowGallery = async () => {
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
  };

  const handleAlbumSelectorPress = () => {
    showFolderSelection();
  };


  // Remove automatic album fetching on mount - it should be triggered manually
  // when the user actually opens the picker to avoid performance issues

  // console.log("albums", albums);

  return {
    fetchAlbums,
    setisCommunityUpload,
    isFolderSelectionVisible,
    checkPermissionAndShowGallery,
    setUploadMode,
    handleAlbumSelectorPress,
    selectedAlbum,
    albumSelectorRef,
  };
};

export default useAlbum;
