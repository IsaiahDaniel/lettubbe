export class TimestampService {
  static formatMessageTime(timeString?: string): string {
    if (!timeString) return "";

    try {
      const messageTime = new Date(timeString);
      if (isNaN(messageTime.getTime())) return "";

      return messageTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "";
    }
  }

  static shouldShowTimestamp(
    message: any, 
    messages: any[], 
    index: number
  ): boolean {
    if (!messages || !Array.isArray(messages) || index === undefined) return true;

    const currentSender = message.userId;
    const currentTime = new Date(message.createdAt || message.time || '');
    const currentMinute = currentTime.getTime() - (currentTime.getTime() % 60000);

    const sameMinuteMessages = messages.filter(msg => {
      if (!msg || !msg.userId || !msg.createdAt) return false;

      const msgSender = msg.userId;
      const msgTime = new Date(msg.createdAt);
      const msgMinute = msgTime.getTime() - (msgTime.getTime() % 60000);

      return msgSender === currentSender && msgMinute === currentMinute;
    });

    if (sameMinuteMessages.length <= 1) return true;

    sameMinuteMessages.sort((a, b) =>
      new Date(a.createdAt || '').getTime() -
      new Date(b.createdAt || '').getTime()
    );

    const latestMessage = sameMinuteMessages[sameMinuteMessages.length - 1];
    const latestMessageId = latestMessage.id || latestMessage._id;
    const currentMessageId = message.id || message._id;

    return latestMessageId === currentMessageId;
  }
}