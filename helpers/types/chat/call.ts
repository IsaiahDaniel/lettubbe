export type CallStatus = 
  | 'idle'
  | 'connecting'
  | 'ringing'
  | 'connected'
  | 'reconnecting'
  | 'ended';

export type CallType = 'audio' | 'video';

export type CallDirection = 'incoming' | 'outgoing';

export type CallSection = {
  title: string;
  data: CallHistoryItem[];
  isFavoritesSection?: boolean;
  isRecentSection?: boolean;
};

// Contact interface
export interface Contact {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
  isSubscribed?: boolean;
}

// Call participant
export interface CallParticipant {
  contact: Contact;
  muted: boolean;
  videoEnabled: boolean;
  stream?: any; // Generic stream type
  isLocal?: boolean;
}

// Call session
export interface CallSession {
  id: string;
  type: CallType;
  direction: CallDirection;
  status: CallStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  participants: CallParticipant[];
}

// Call history item
export interface CallHistoryItem {
  id: string;
  contactId: string;
  type: CallType;
  direction: CallDirection;
  timestamp: Date;
  duration?: number;
  missed: boolean;
  groupCall: boolean;
}

// Call error
export interface CallError {
  code: string;
  message: string;
}