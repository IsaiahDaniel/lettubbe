// Main component
export { default as InboxScreen } from './InboxScreen';

// Components
export { InboxHeader } from './components/InboxHeader';
export { ProfileCard } from './components/ProfileCard';
export { MessageRenderer } from './components/MessageRenderer';
export { TimestampDisplay } from './components/TimestampDisplay';
export { InboxErrorBoundary } from './components/ErrorBoundary';
export { default as MessageView } from './components/MessageView';
export { default as ChatInputContainer } from './components/ChatInputContainer';
export { default as ProfileSection } from './components/ProfileSection';

// Message types
export { CommunityInviteMessage } from './components/message-types/CommunityInviteMessage';
export { MediaAttachmentMessage } from './components/message-types/MediaAttachmentMessage';
export { RegularMessage } from './components/message-types/RegularMessage';

// Services
export { MessageExtractorService } from './services/MessageExtractorService';
export { TimestampService } from './services/TimestampService';
export { ShareVideoService } from './services/ShareVideoService';
export { OptimisticMessageService } from './services/OptimisticMessageService';

// Hooks
export { useInboxProfile } from './hooks/useInboxProfile';
export { useOptimisticMessages } from './hooks/useOptimisticMessages';
export { useLazyFeatures, useLazyUploadFeatures, useLazyProfileFeatures, useInboxParams } from './hooks/useLazyFeatures';

// Types
export type {
  InboxMessage,
  InboxProfile,
  InboxProps,
  MessageRenderProps
} from './types/InboxTypes';
