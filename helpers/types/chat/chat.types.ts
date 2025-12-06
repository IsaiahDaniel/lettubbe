export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePicture?: string;
}

export interface Message {
  _id: string;
  text: string;
  imageUrl?: string;
  images?: string[];
  videoUrl?: string;
  audioUrl?: string;
  documentUrl?: string;
  documentUrls?: string[];
  seen: boolean;
  userId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatPreview {
  otherUser: any;
  id: string;
  _id: string;
  sender: User;
  receiver: User;
  isArchived: boolean;
  isFavourite: boolean;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}


export interface Community {
  id: string;
  name: string;
  avatar: string;
  memberCount: number;
  isJoined: boolean;
  description: string;
  type?: string; // 'public' or 'private'
  lastMessage?: string | null;
  lastMessageTime?: string | null;
  members?: string[]; // Array of member IDs
  membersWithProfiles?: Array<{
    _id: string;
    profilePicture?: string;
    username?: string;
  }>; // Full member objects with profile pictures
  hasPendingRequest?: boolean; // Whether user has a pending join request
  _rawData?: any; // Raw API data for pending checks
}

export interface GroupUserIdType {
  username: string;
  _id: string;
  profilePicture: string;
}

export interface CommunityMessage {
  localMedia: boolean;
  isUploading: any;
  uploadError: any;
  _id: string;
  isDeleted: boolean;
  repliedTo: any;
  id: string;
  username: string;
  userId: GroupUserIdType;
  avatar: string;
  text: string;
  createdAt: string;
  isOwnMessage: boolean;
  imageUrl?: string,
  images?: string[]; 
  videoUrl: string;
}

export interface CommunityMember {
  id: string;
  username: string;
  avatar: string;
  role: 'admin' | 'moderator' | 'member';
}