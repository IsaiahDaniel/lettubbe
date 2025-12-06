export interface EditVideoFormData {
  description: string;
  tags: string[];
  isPublic: boolean;
  allowComments: boolean;
  thumbnail: string;
}

export interface EditVideoProps {
  video: VideoToEdit;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface VideoToEdit {
  _id: string;
  description?: string;
  tags?: string[] | string;
  thumbnail?: string;
  videoUrl?: string;
  images?: string[];
  isPublic?: boolean;
  allowComments?: boolean;
  duration?: number | string;
  createdAt?: string;
  user?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profilePicture?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface TagSearchState {
  searchQuery: string;
  showResults: boolean;
  filteredTags: string[];
}

export interface UpdatePostRequest {
  description?: string;
  visibility: 'public' | 'private';
  isCommentsAllowed: boolean;
  tags: string;
  thumbnailImage?: File | FormData;
}