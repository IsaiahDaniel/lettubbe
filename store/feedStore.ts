import { create } from "zustand";
import { MentionUser } from '@/store/videoUploadStore';

export interface VideoItem {
  isCommentsAllowed: boolean | undefined;
  commentCount: number;
  _id: string;
  thumbnail: string;
  images?: string[]; // For photo posts
  photoUrl?: string; // For single photo posts
  duration: string;
  description: string;
  videoUrl: string;
  mediaType?: 'photo' | 'video'; // Media type identification
  mentions?: MentionUser[]; // Mentions data for rendering
  createdAt: string;
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
  viewCount?: number;
  user: {
    username: any;
    subscribers: any;
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
}

interface IPostSore {
  postItem: VideoItem | null;
  setPostItem: (item: VideoItem) => void;
  reset: () => void;
}

interface VideoItemStore {
  selectedItem: VideoItem | null;
  lastMediaType: 'photo' | 'video' | null;
  setSelectedItem: (item: VideoItem | null) => void;
  updatePostCommentCount: (postId: string, increment: number) => void;
  clearThumbnailCache: () => void;
  reset: () => void;
}

export const useGetVideoItemStore = create<VideoItemStore>((set) => ({
  selectedItem: null,
  lastMediaType: null,
  
  setSelectedItem: (item) => set({ 
    selectedItem: item,
    lastMediaType: item?.mediaType || null
  }),
  
  // Clear thumbnail cache and prevent cross-contamination between media types
  clearThumbnailCache: () => set({ 
    selectedItem: null,
    lastMediaType: null
  }),

  // Function to increment/decrement comment count
  updatePostCommentCount: (postId: string, increment: number) =>
    set((state) => {
      if (state.selectedItem && state.selectedItem._id === postId) {
        return {
          selectedItem: {
            ...state.selectedItem,
            commentCount: Math.max(
              0,
              (state.selectedItem.commentCount || 0) + increment
            ),
          },
        };
      }
      return state;
    }),

  reset: () => set({ 
    selectedItem: null,
    lastMediaType: null
  }),
}));

export const useGetPostItemStore = create<IPostSore>((set) => ({
  postItem: null,
  setPostItem: (item) => set({ postItem: item }),
  reset: () => set({ postItem: null }),
}));
