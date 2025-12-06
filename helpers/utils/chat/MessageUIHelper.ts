interface Message {
  _id: string;
  id?: string;
  text: string;
  userId: string;
  createdAt: string;
  isOptimistic?: boolean;
  sender?: string;
}

interface UserDetails {
  _id: string;
}

export class MessageUIHelper {
  /**
   * Prepares messages for UI rendering with guaranteed user context
   */
  static prepareMessagesForUI(
    messages: Message[],
    currentUserId: string
  ): Array<Message & { isCurrentUser: boolean }> {
    if (!currentUserId || !messages.length) {
      return [];
    }

    return messages.map(message => ({
      ...message,
      // Ensure consistent userId
      userId: message.userId || message.sender || '',
      // Pre-calculate isCurrentUser to prevent UI calculation errors
      isCurrentUser: (message.userId || message.sender || '') === currentUserId,
    }));
  }
}