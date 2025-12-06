import React, { useRef } from 'react';

import { ChatMediaViewerProps, MediaItem } from './types';
import { MediaViewerBase } from './components/MediaViewerBase';
import { VideoViewer } from './components/VideoViewer';
import { PhotoViewer } from './components/PhotoViewer';

const ChatMediaViewer: React.FC<ChatMediaViewerProps> = ({
  visible,
  mediaItems,
  initialIndex = 0,
  onClose,
  senderName,
  timestamp,
}) => {
  const videoViewersRef = useRef<Map<number, any>>(new Map());

  const handleCleanup = () => {
    videoViewersRef.current.forEach((viewer, index) => {
      if (viewer && viewer.cleanup) {
        viewer.cleanup();
      }
    });
    videoViewersRef.current.clear();
  };

  const renderMedia = (item: MediaItem, index: number, currentIndex: number, props: any) => {
    if (item.type === 'video') {
      return (
        <VideoViewer
          item={item}
          index={index}
          currentIndex={currentIndex}
          onMediaPress={props.onMediaPress}
          videoPlayer={props.videoPlayer}
          isCurrentVideo={props.isCurrentVideo}
          isBuffering={props.isBuffering}
        />
      );
    } else {
      return (
        <PhotoViewer
          item={item}
          index={index}
          onMediaPress={props.onMediaPress}
        />
      );
    }
  };

  return (
    <MediaViewerBase
      visible={visible}
      mediaItems={mediaItems}
      initialIndex={initialIndex}
      onClose={onClose}
      senderName={senderName}
      timestamp={timestamp}
      renderMedia={renderMedia}
      onCleanup={handleCleanup}
    />
  );
};

export default ChatMediaViewer;