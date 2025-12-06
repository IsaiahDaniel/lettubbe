/**
 * Utility functions for date manipulation and formatting in chat contexts
 */

export interface MessageWithDate {
  id?: string;
  text: string;
  userId: string | any; // Allow for complex userId types like GroupUserIdType
  time?: string;
  createdAt?: string;
  seen?: boolean;
  [key: string]: any;
}

export interface GroupedMessage {
  date: string;
  messages: MessageWithDate[];
}

/**
 * Groups messages by date for display with date separators
 * @param messages Array of messages to group
 * @returns Array of grouped messages with date headers
 */
export const groupMessagesByDate = (messages: MessageWithDate[]): GroupedMessage[] => {
  if (!messages || messages.length === 0) {
    return [];
  }

  const groups: { [key: string]: MessageWithDate[] } = {};

  messages.forEach((message) => {
    const messageDate = message.time || message.createdAt;
    if (!messageDate) return;

    try {
      const date = new Date(messageDate);
      if (isNaN(date.getTime())) return;

      // Format date as YYYY-MM-DD for grouping
      const dateKey = date.toISOString().split('T')[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    } catch (error) {
      console.warn('Error parsing message date:', error);
    }
  });

  // Convert to array and sort by date
  const groupedArray = Object.keys(groups)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map(dateKey => ({
      date: dateKey,
      // Sort messages within each day: oldest first (for proper chat flow)
      messages: groups[dateKey].sort((a, b) => {
        const dateA = new Date(a.time || a.createdAt || 0).getTime();
        const dateB = new Date(b.time || b.createdAt || 0).getTime();
        return dateA - dateB; // Oldest first within each day
      })
    }));

  return groupedArray;
};

/**
 * Formats a date for display as a date separator
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Formatted date string for display
 */
export const formatDateSeparator = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time for accurate comparison
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (messageDate.getTime() === todayDate.getTime()) {
      return 'Today';
    } else if (messageDate.getTime() === yesterdayDate.getTime()) {
      return 'Yesterday';
    } else {
      // Show day and date for older messages
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch (error) {
    console.warn('Error formatting date separator:', error);
    return dateString;
  }
};

/**
 * Flattens grouped messages into a single array with date separators
 * @param groupedMessages Array of grouped messages
 * @returns Flat array with date separators inserted
 */
export const flattenMessagesWithSeparators = (groupedMessages: GroupedMessage[]): (MessageWithDate | { type: 'dateSeparator'; date: string; displayDate: string })[] => {
  const result: any[] = [];

  groupedMessages.forEach((group, index) => {
    // Add date separator before each group
    result.push({
      type: 'dateSeparator',
      date: group.date,
      displayDate: formatDateSeparator(group.date),
      id: `date-separator-${group.date}`
    });

    // Add all messages for this date
    result.push(...group.messages);
  });

  return result;
};