export interface Comment {
  _id: string;
  text: string;
  user: {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  likes: string[];
  replies: any[];
  createdAt: string;
  profilePicture?: string;
  fromCommunity?: string;
  isOptimistic?: boolean;
  mentions?: Array<{
    userId: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  }>;
}

export interface SortOption {
  id: string;
  name: string;
  selected: boolean;
}

export interface DateRange {
  from: Date | null;
  to: Date | null;
}
