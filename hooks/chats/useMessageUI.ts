import { useState } from "react";
import * as Haptics from "expo-haptics";

interface MessagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const useMessageUI = () => {
  const [showMessageActionModal, setShowMessageActionModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [messagePosition, setMessagePosition] = useState<MessagePosition | null>(null);
  const [longPressedMessageId, setLongPressedMessageId] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const handleLongPress = (event: any, item: any) => {
    if (item.isDeleted) return;

    const messageId = item.id || item._id;
    console.log("🔍 Long press triggered for messageId:", messageId);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (messageId) {
      setLongPressedMessageId(messageId);
    }

    // Use actual message position if available, fallback to event coordinates
    if (event.messagePosition) {
      setMessagePosition(event.messagePosition);
    } else {
      const coordinates = extractCoordinates(event);
      setMessagePosition({
        x: coordinates.pageX,
        y: coordinates.pageY,
        width: 200,
        height: 60,
      });
    }

    setSelectedMessage(item);
    setShowMessageActionModal(true);
  };

  const extractCoordinates = (event: any) => {
    if (event.nativeEvent?.pageX !== undefined) {
      return {
        pageX: event.nativeEvent.pageX,
        pageY: event.nativeEvent.pageY,
      };
    }
    
    if (event.absoluteX !== undefined) {
      return {
        pageX: event.absoluteX,
        pageY: event.absoluteY,
      };
    }

    console.warn("⚠️ No coordinates found in event, using screen center");
    return { pageX: 200, pageY: 400 };
  };

  const closeModal = () => {
    setShowMessageActionModal(false);
    setSelectedMessage(null);
    setMessagePosition(null);
    setLongPressedMessageId(null);
  };

  const highlightMessage = (messageId: string) => {
    setHighlightedMessageId(messageId);
    setTimeout(() => setHighlightedMessageId(null), 500);
  };

  return {
    showMessageActionModal,
    selectedMessage,
    messagePosition,
    longPressedMessageId,
    highlightedMessageId,
    handleLongPress,
    closeModal,
    highlightMessage,
  };
};