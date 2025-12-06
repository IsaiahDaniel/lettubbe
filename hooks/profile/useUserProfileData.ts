import { useState, useEffect, useCallback } from "react";
import useGetPublicProfile from "./useGetPublicProfile";
import useGetUserPublicUploads from "../upload/useGetUserPublicUploads";
import useGetUserPublicPlaylists from "./useGetUserPublicPlaylists";

interface UseUserProfileDataProps {
  userId: string | undefined;
  isVisible: boolean;
}

export const useUserProfileData = ({ userId, isVisible }: UseUserProfileDataProps) => {
  const [enableDataLoading, setEnableDataLoading] = useState(false);
  const [showRealData, setShowRealData] = useState(false);
  const [enableGalleryLoading, setEnableGalleryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Always disable queries initially to prevent automatic fetching
  const profileHook = useGetPublicProfile(userId as string, { enabled: false });
  const playlistsHook = useGetUserPublicPlaylists(userId as string, { enabled: false });
  const videosHook = useGetUserPublicUploads(userId as string, { enabled: false, type: "videos" });
  const photosHook = useGetUserPublicUploads(userId as string, { enabled: false, type: "photos" });

  // Return data immediately if available, regardless of loading state
  const profileData = profileHook.data || null;
  const coverPic = profileHook.coverPic || null;
  const profilePic = profileHook.profilePic || null;
  const userPlaylists = playlistsHook.data || null;
  const userVideos = videosHook.data || null;
  const userPhotos = photosHook.data || null;

  const refetchProfileRef = useCallback(() => {
    if (profileHook.refetch) profileHook.refetch();
  }, []);

  const refetchUserPlaylistsRef = useCallback(() => {
    if (playlistsHook.refetch) playlistsHook.refetch();
  }, []);

  const refetchUserVideosRef = useCallback(() => {
    if (videosHook.refetch) videosHook.refetch();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      refetchProfileRef(),
      refetchUserVideosRef(),
      refetchUserPlaylistsRef(),
    ]);
    setRefreshing(false);
  }, [refetchProfileRef, refetchUserVideosRef, refetchUserPlaylistsRef]);

  useEffect(() => {
    // console.log('📊 [PROFILE_DATA] Effect triggered:', {
    //   isVisible,
    //   userId,
    //   timestamp: Date.now(),
    //   time: new Date().toISOString()
    // });

    if (isVisible && userId) {
      // Wait for bottom sheet animation to complete before loading any data
      const loadDataAfterAnimation = setTimeout(async () => {
        // console.log('📊 [PROFILE_DATA] Bottom sheet opened, starting data loading...');
        
        setEnableDataLoading(true);
        
        const abortController = new AbortController();
        let isMounted = true;
        
        const loadData = async () => {
          if (!isMounted) return;

          // console.log('📊 [PROFILE_DATA] Starting profile fetch...');
          // Start loading profile data
          const profilePromise = refetchProfileRef();
          
          // After a short delay, mark as showing real data (for skeleton transition)
          setTimeout(() => {
            if (isMounted) {
              // console.log('📊 [PROFILE_DATA] Setting showRealData to true');
              setShowRealData(true);
            }
          }, 300);
          
          await profilePromise;
          // console.log('📊 [PROFILE_DATA] Profile data loaded');

          // Only enable gallery loading after profile data is loaded
          setTimeout(() => {
            if (isMounted) {
              setEnableGalleryLoading(true);
              
              // Load gallery data in background
              setTimeout(async () => {
                if (!isMounted) return;
                
                // console.log('📊 [PROFILE_DATA] Loading gallery data...');
                await Promise.allSettled([
                  refetchUserPlaylistsRef(),
                  refetchUserVideosRef()
                ]);
                // console.log('📊 [PROFILE_DATA] Gallery data loaded');
              }, 100);
            }
          }, 200);
        };

        loadData();
      }, 500); // Wait 500ms for bottom sheet animation to complete

      return () => {
        clearTimeout(loadDataAfterAnimation);
      };
    } else {
      // console.log('📊 [PROFILE_DATA] Resetting states (not visible or no userId)');
      // Immediately reset states when closing to prevent flash of fallback data
      setEnableDataLoading(false);
      setShowRealData(false);
      setEnableGalleryLoading(false);
      setRefreshing(false);
    }
  }, [isVisible, userId]);

  return {
    profileData,
    coverPic,
    profilePic,
    userPlaylists,
    userVideos,
    userPhotos,
    isLoadingProfile: isVisible && userId ? (!showRealData || !profileData) : false,
    enableGalleryLoading,
    refreshing,
    onRefresh,
    videosHookData: {
      isPending: videosHook.isPending,
      fetchNextPage: videosHook.fetchNextPage,
      hasNextPage: videosHook.hasNextPage,
      isFetchingNextPage: videosHook.isFetchingNextPage,
    },
    photosHookData: {
      fetchNextPage: photosHook.fetchNextPage,
      hasNextPage: photosHook.hasNextPage,
      isFetchingNextPage: photosHook.isFetchingNextPage,
    },
    playlistsHookData: {
      fetchNextPage: playlistsHook.fetchNextPage,
      hasNextPage: playlistsHook.hasNextPage,
      isFetchingNextPage: playlistsHook.isFetchingNextPage,
    },
  };
};