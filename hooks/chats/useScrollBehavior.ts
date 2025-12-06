import { useState, useRef, useCallback, useEffect } from "react";
import { FlatList } from "react-native";
import { isCommunityMessage } from "@/helpers/utils/messageUtils";

export const useScrollBehavior = (messagesWithDateSeparators: any[], highlightMessage?: (messageId: string) => void) => {
  const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = useCallback((event: any) => {
    const { contentOffset } = event.nativeEvent;
    const isScrolledUp = contentOffset.y > 100;
    setShowScrollToBottomButton(isScrolledUp);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (flatListRef?.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      setShowScrollToBottomButton(false);
    }
  }, []);

  const scrollToMessage = useCallback((messageId: string) => {
    console.log("🎯 [SCROLL] scrollToMessage called with messageId:", messageId);
    
    if (!flatListRef.current || !messagesWithDateSeparators) {
      console.log("🎯 [SCROLL] Missing flatListRef or messages:", {
        hasFlatListRef: !!flatListRef.current,
        hasMessages: !!messagesWithDateSeparators,
        messagesLength: messagesWithDateSeparators?.length || 0
      });
      return;
    }

    try {
      // For inverted FlatList, we don't reverse the array
      console.log("🎯 [SCROLL] Searching in messages:", {
        totalMessages: messagesWithDateSeparators.length,
        targetMessageId: messageId,
        firstFewIds: messagesWithDateSeparators.slice(0, 5).map(msg => 
          isCommunityMessage(msg) ? (msg._id || msg.id) : 'date-separator'
        )
      });
      
      const messageIndex = messagesWithDateSeparators.findIndex((msg) => {
        if (isCommunityMessage(msg)) {
          const matches = msg._id === messageId || msg.id === messageId;
          if (matches) {
            console.log("🎯 [SCROLL] Found matching message:", {
              messageId,
              foundAt: messageIndex,
              msgId: msg.id,
              msg_Id: msg._id,
              text: msg.text?.substring(0, 50)
            });
          }
          return matches;
        }
        return false;
      });

      console.log("🎯 [SCROLL] Message search result:", {
        messageIndex,
        found: messageIndex !== -1
      });

      if (messageIndex !== -1) {
        console.log("🎯 [SCROLL] Attempting scrollToIndex:", {
          index: messageIndex,
          viewPosition: 0.5
        });
        
        try {
          flatListRef.current.scrollToIndex({
            index: messageIndex,
            animated: true,
            viewPosition: 0.5, // Center the message on screen
          });
          
          console.log("🎯 [SCROLL] scrollToIndex completed successfully, scheduling highlight");
          
          // Highlight the message immediately
          if (highlightMessage) {
            console.log("🎯 [SCROLL] Calling highlightMessage for:", messageId);
            highlightMessage(messageId);
          }
        } catch (scrollError) {
          console.error("🎯 [SCROLL] scrollToIndex failed:", scrollError);
          // Try scrollToOffset as fallback with center positioning
          try {
            const estimatedItemHeight = 120;
            const estimatedOffset = messageIndex * estimatedItemHeight;
            flatListRef.current.scrollToOffset({
              offset: estimatedOffset,
              animated: true
            });
            console.log("🎯 [SCROLL] Used scrollToOffset fallback");
            
            if (highlightMessage) {
              setTimeout(() => highlightMessage(messageId), 0);
            }
          } catch (offsetError) {
            console.error("🎯 [SCROLL] scrollToOffset fallback also failed:", offsetError);
          }
        }
      } else {
        console.log("🎯 [SCROLL] Message not found in list");
      }
    } catch (error) {
      console.error("🎯 [SCROLL] Error scrolling to message:", error);
      try {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        console.log("🎯 [SCROLL] Fallback scroll to bottom completed");
      } catch (fallbackError) {
        console.error("🎯 [SCROLL] Fallback scroll also failed:", fallbackError);
      }
    }
  }, [messagesWithDateSeparators, highlightMessage]);

  return {
    showScrollToBottomButton,
    flatListRef,
    handleScroll,
    scrollToBottom,
    scrollToMessage,
  };
};