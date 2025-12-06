import { create } from 'zustand';

interface PlaylistVideo {
  _id: string;
  thumbnail: string;
  duration: string;
  videoUrl: string;
  description: string;
  createdAt: string;
  commentCount: number;
  viewCount: number;
  comments: {
    _id: string;
    text: string;
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      profilePicture: string;
    };
    createdAt: string;
  }[];
  reactions: {
    likes: string[];
  };
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
    username: any;
    subscribers: any;
  };
  
  title?: string;
  playlistId?: string;
  playlistPosition?: number;
}

interface PlaylistState {
  currentPlaylist: PlaylistVideo[];
  currentVideoIndex: number;
  isPlayingPlaylist: boolean;
  playlistId: string | null;
  autoPlay: boolean;
  playlistComplete: boolean; 
  
  // Actions
  setPlaylist: (videos: PlaylistVideo[], startIndex?: number, playlistId?: string | null, autoPlay?: boolean) => void;
  nextVideo: () => PlaylistVideo | null;
  previousVideo: () => PlaylistVideo | null;
  setCurrentIndex: (index: number) => void;
  clearPlaylist: () => void;
  getCurrentVideo: () => PlaylistVideo | null;
  hasNextVideo: () => boolean;
  hasPreviousVideo: () => boolean;
  setAutoPlay: (autoPlay: boolean) => void; 
  restartPlaylist: () => PlaylistVideo | null; 
  markPlaylistComplete: () => void; 
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  currentPlaylist: [],
  currentVideoIndex: 0,
  isPlayingPlaylist: false,
  playlistId: null,
  autoPlay: true, 
  playlistComplete: false,

  setPlaylist: (videos, startIndex = 0, playlistId = null, autoPlay = true) => {
    // Validate playlist ID to prevent invalid values like "video"
    const invalidPlaylistIds = ['video', 'photo', 'community', 'streaming', ''];
    const sanitizedPlaylistId = (playlistId && !invalidPlaylistIds.includes(playlistId)) ? playlistId : null;
    
    // Enhanced debug logging with stack trace
    const isInvalidId = playlistId && invalidPlaylistIds.includes(playlistId);
    if (isInvalidId) {
      console.error('🚨 PLAYLIST DEBUG: Invalid playlist ID detected!', {
        originalPlaylistId: playlistId,
        invalidPlaylistIds,
        stackTrace: new Error().stack
      });
    }
    
    console.log('🎵 PLAYLIST DEBUG: Setting playlist:', { 
      videoCount: videos.length, 
      startIndex, 
      originalPlaylistId: playlistId,
      sanitizedPlaylistId, 
      autoPlay,
      wasInvalid: isInvalidId,
      callerStack: new Error().stack?.split('\n').slice(1, 4).join('\n')
    });
    
    set({
      currentPlaylist: videos,
      currentVideoIndex: startIndex,
      isPlayingPlaylist: true,
      playlistId: sanitizedPlaylistId,
      autoPlay,
      playlistComplete: false,
    });
  },

  nextVideo: () => {
    const { currentPlaylist, currentVideoIndex, autoPlay } = get();
    const nextIndex = currentVideoIndex + 1;
    
    console.log('NextVideo called:', { 
      currentIndex: currentVideoIndex, 
      nextIndex, 
      totalVideos: currentPlaylist.length,
      autoPlay 
    });
    
    if (nextIndex < currentPlaylist.length) {
      set({ 
        currentVideoIndex: nextIndex,
        playlistComplete: false 
      });
      
      const nextVideo = currentPlaylist[nextIndex];
      console.log('Moving to next video:', nextVideo.description || nextVideo._id);
      return nextVideo;
    }
    
    // End of playlist reached
    console.log('Playlist completed');
    set({ 
      isPlayingPlaylist: false,
      playlistComplete: true 
    });
    return null;
  },

  previousVideo: () => {
    const { currentPlaylist, currentVideoIndex } = get();
    const prevIndex = currentVideoIndex - 1;
    
    if (prevIndex >= 0) {
      set({ 
        currentVideoIndex: prevIndex,
        playlistComplete: false 
      });
      
      const prevVideo = currentPlaylist[prevIndex];
      console.log('Moving to previous video:', prevVideo.description || prevVideo._id);
      return prevVideo;
    }
    
    return null;
  },

  setCurrentIndex: (index) => {
    const { currentPlaylist } = get();
    if (index >= 0 && index < currentPlaylist.length) {
      console.log('Setting current index to:', index);
      set({ 
        currentVideoIndex: index,
        playlistComplete: false 
      });
    }
  },

  clearPlaylist: () => {
    console.log('Clearing playlist');
    set({
      currentPlaylist: [],
      currentVideoIndex: 0,
      isPlayingPlaylist: false,
      playlistId: null,
      autoPlay: true,
      playlistComplete: false,
    });
  },

  getCurrentVideo: () => {
    const { currentPlaylist, currentVideoIndex } = get();
    return currentPlaylist[currentVideoIndex] || null;
  },

  hasNextVideo: () => {
    const { currentPlaylist, currentVideoIndex } = get();
    const hasNext = currentVideoIndex < currentPlaylist.length - 1;
    console.log('HasNextVideo:', { currentIndex: currentVideoIndex, totalVideos: currentPlaylist.length, hasNext });
    return hasNext;
  },

  hasPreviousVideo: () => {
    const { currentVideoIndex } = get();
    return currentVideoIndex > 0;
  },

  setAutoPlay: (autoPlay) => {
    console.log('Setting autoPlay to:', autoPlay);
    set({ autoPlay });
  },

  restartPlaylist: () => {
    const { currentPlaylist } = get();
    if (currentPlaylist.length > 0) {
      console.log('Restarting playlist from beginning');
      set({ 
        currentVideoIndex: 0,
        isPlayingPlaylist: true,
        playlistComplete: false 
      });
      return currentPlaylist[0];
    }
    return null;
  },

  markPlaylistComplete: () => {
    console.log('Marking playlist as complete');
    set({ 
      playlistComplete: true,
      isPlayingPlaylist: false 
    });
  },
}));