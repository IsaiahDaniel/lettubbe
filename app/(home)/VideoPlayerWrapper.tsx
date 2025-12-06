import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

import { getPost } from '@/services/feed.service';
import { useGetVideoItemStore, VideoItem } from '@/store/feedStore';
import VideoPlayer from './VideoPlayer';
import DeepLinkErrorBoundary from '@/components/shared/error/DeepLinkErrorBoundary';
import VideoPlayerSkeleton from '@/components/shared/skeletons/VideoPlayerSkeleton';

const VideoPlayerWrapper = () => {
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { selectedItem, setSelectedItem } = useGetVideoItemStore();

  // Handle deep link data loading
  useEffect(() => {
    const postId = params.postId as string;
    
    // Only fetch if we have a postId and either no selectedItem or wrong item
    if (postId && (!selectedItem || selectedItem._id !== postId)) {
      console.log('VideoPlayerWrapper: Loading data for postId:', postId);
      setIsLoading(true);
      
      // Clear any existing data first - with error handling
      try {
        const store = useGetVideoItemStore.getState();
        if (store && typeof store.clearThumbnailCache === 'function') {
          store.clearThumbnailCache();
        }
      } catch (storeError) {
        console.log('VideoPlayerWrapper: Error accessing store:', storeError);
      }
      
      const fetchPostData = async () => {
        try {
          const response = await getPost(postId);
          
          if (response.data && (response.data.post || response.data._id)) {
            const postData = response.data.post || response.data;
            
            // Transform to VideoItem format for videos
            const isPhoto = postData.images && Array.isArray(postData.images) && postData.images.length > 0;
            
            const videoItem: VideoItem = {
              _id: postData._id,
              thumbnail: postData.thumbnail || (isPhoto ? postData.images[0] : ""),
              duration: postData.duration?.toString() || "",
              description: postData.description || "",
              videoUrl: postData.videoUrl || "",
              images: postData.images || [],
              photoUrl: isPhoto ? postData.images[0] : undefined,
              mediaType: 'video' as const,
              createdAt: postData.createdAt || "",
              comments: postData.comments || [],
              isCommentsAllowed: typeof postData.isCommentsAllowed === 'boolean' ? postData.isCommentsAllowed : undefined,
              reactions: {
                likes: postData.reactions?.likes || []
              },
              viewCount: postData.reactions?.totalViews || 0,
              commentCount: postData.comments?.length || 0,
              user: {
                username: postData.user?.username || "",
                subscribers: postData.user?.subscribers || [],
                _id: postData.user?._id || postData.user || "",
                firstName: postData.user?.firstName || "",
                lastName: postData.user?.lastName || "",
                profilePicture: postData.user?.profilePicture || ""
              }
            };
            
            setTimeout(() => {
              setSelectedItem(videoItem);
              setDataLoaded(true);
              console.log('VideoPlayerWrapper: Successfully loaded video data');
            }, 100);
          } else {
            console.log('VideoPlayerWrapper: Post not found');
            router.replace('/(tabs)');
          }
        } catch (error) {
          console.log('VideoPlayerWrapper: Error fetching post data:', error);
          router.replace('/(tabs)');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchPostData();
    } else if (selectedItem && selectedItem._id === postId) {
      setDataLoaded(true);
    }
  }, [params.postId]);

  // Show skeleton loader while fetching data
  if (isLoading || !dataLoaded || !selectedItem) {
    return <VideoPlayerSkeleton />;
  }

  // Render the actual VideoPlayer once data is loaded
  return (
    <DeepLinkErrorBoundary>
      <VideoPlayer />
    </DeepLinkErrorBoundary>
  );
};

export default VideoPlayerWrapper;