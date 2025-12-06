import { useState, useCallback } from 'react';
import { ChatPreview } from '@/helpers/types/chat/chat.types';

interface ContextMenuState {
  visible: boolean;
  chat: ChatPreview | null;
  position: { x: number; y: number };
}

export const useChatContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    chat: null,
    position: { x: 0, y: 0 },
  });

  const showContextMenu = useCallback((chat: ChatPreview, position: { x: number; y: number }) => {
    setContextMenu({
      visible: true,
      chat,
      position,
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenu({
      visible: false,
      chat: null,
      position: { x: 0, y: 0 },
    });
  }, []);

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
  };
};