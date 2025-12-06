export interface MediaItem {
  uri: string;
  type: 'image' | 'video' | 'audio';
  caption?: string;
}

export interface ChatMediaViewerProps {
  visible: boolean;
  mediaItems: MediaItem[];
  initialIndex?: number;
  onClose: () => void;
  senderName?: string;
  timestamp?: string;
}

export interface MediaViewerState {
  currentIndex: number;
  showControls: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  isDragging: boolean;
}

export interface VideoControlsProps {
  visible: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onProgressPress: (event: any) => void;
}

export interface MediaHeaderProps {
  visible: boolean;
  senderName?: string;
  timestamp?: string;
  currentIndex: number;
  totalItems: number;
  onClose: () => void;
  onDownload?: () => void;
  isDownloading?: boolean;
}

export interface MediaIndicatorsProps {
  visible: boolean;
  currentIndex: number;
  totalItems: number;
}

export interface MediaCaptionProps {
  visible: boolean;
  caption?: string;
}

export interface GestureHandlers {
  panGesture: any;
  pinchGesture: any;
  combinedGesture: any;
}

export interface AnimationValues {
  translateY: any;
  scale: any;
  opacity: any;
  controlsOpacity: any;
  scrollX: any;
  backgroundOpacity: any;
}