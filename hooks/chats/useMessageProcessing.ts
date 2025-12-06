import { useMemo } from "react";
import { formatDateSeparator } from "@/helpers/utils/dateUtils";
import { CommunityMessage, MessageListItem, DateSeparatorItem, CommunityMessageWithType } from "@/helpers/types/chat/message.types";

export const useMessageProcessing = () => {
  const processMessagesWithDateSeparators = useMemo(() => {
    return (messagesToProcess: CommunityMessage[]): MessageListItem[] => {
      if (!messagesToProcess || !Array.isArray(messagesToProcess) || messagesToProcess.length === 0) {
        return [];
      }

      const groups: { [key: string]: CommunityMessage[] } = {};

      messagesToProcess.forEach((message) => {
        if (!message || !message.createdAt) return;

        try {
          const date = new Date(message.createdAt);
          if (isNaN(date.getTime())) return;

          const dateKey = date.toISOString().split("T")[0];

          if (!groups[dateKey]) {
            groups[dateKey] = [];
          }
          groups[dateKey].push(message);
        } catch (error) {
          console.warn("Error parsing message date:", error);
        }
      });

      const result: MessageListItem[] = [];
      const sortedDateKeys = Object.keys(groups).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );

      sortedDateKeys.forEach((dateKey) => {
        const dayMessages = groups[dateKey];
        if (Array.isArray(dayMessages)) {
          const sortedDayMessages = dayMessages.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return timeB - timeA;
          });
          result.push(...(sortedDayMessages as CommunityMessageWithType[]));
        }

        const displayDate = formatDateSeparator(dateKey);
        const dateSeparator: DateSeparatorItem = {
          type: "dateSeparator",
          date: dateKey,
          displayDate: displayDate,
          id: `date-separator-${dateKey}`,
        };
        result.push(dateSeparator);
      });

      return result;
    };
  }, []);

  return { processMessagesWithDateSeparators };
};