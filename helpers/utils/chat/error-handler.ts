export type ChatError = 
  | 'CONNECTION_FAILED'
  | 'CONNECTION_TIMEOUT'
  | 'NO_INTERNET'
  | 'LOAD_MESSAGES_FAILED'
  | 'SEND_MESSAGE_FAILED'
  | 'INVALID_MESSAGE';

export const createErrorMessage = (error: ChatError): string => {
  const errorMessages: Record<ChatError, string> = {
    CONNECTION_FAILED: "Unable to connect to chat server",
    CONNECTION_TIMEOUT: "Connection timeout. Unable to reach chat server.",
    NO_INTERNET: "No internet connection. Please check your network settings.",
    LOAD_MESSAGES_FAILED: "Failed to load messages",
    SEND_MESSAGE_FAILED: "Failed to send message",
    INVALID_MESSAGE: "Invalid message data: missing text or userId",
  };

  return errorMessages[error];
};

export const logChatError = (error: ChatError, details?: any): void => {
  console.error(`Chat Error [${error}]:`, details);
};

export const handleChatError = (
  error: ChatError, 
  details?: any
): { message: string; shouldRetry: boolean } => {
  logChatError(error, details);
  
  const message = createErrorMessage(error);
  const shouldRetry = error === 'CONNECTION_FAILED' || error === 'CONNECTION_TIMEOUT';
  
  return { message, shouldRetry };
};