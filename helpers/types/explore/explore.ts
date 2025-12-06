export interface Post {
  totalViews: number;
  views: number;
  _id: string;
  id: string;
  user: {
    avatar: string;
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
  thumbnail: string;
  videoUrl: string;
  images: string[];
  description: string;
  visibility: string;
  tags: string[];
  isCommentsAllowed: boolean;
  likes: number;
  dislikes: number;
  shares: number;
  plays: number;
  comments: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
  isLiked: boolean;
  isDisliked: boolean;
  isSaved: boolean;
}

export type ExploreSection = "trending" | "popular" | "forYou";

// Response structure
export interface ExploreResponse {
  trending: Post[];
  popular: Post[];
  forYou: Post[];
  hasMore: boolean;
}

// Search response structure
export interface SearchPostsResponse {
  posts: Post[];
  hasMore: boolean;
  totalDocs: number;
  totalPages: number;
  currentPage: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}
