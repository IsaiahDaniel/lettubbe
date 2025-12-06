import { Socket } from "socket.io-client";
import { socketManager } from "@/helpers/utils/socketManager";
import { ConversationDetails } from "@/helpers/types/chat/chat-message.types";

interface SocketEventHandlers {
  onConnect: () => void;
  onOnlineUsers: (data: string[]) => void;
  onPreviousMessages: (messages: any[]) => void;
  onNewMessage: (message: any) => void;
  onUserTyping: (data: { userId: string }) => void;
  onUserStoppedTyping: (data: { userId: string }) => void;
  onMessagesMarkedAsRead: (data: any) => void;
  onMessageDeleted?: (data: { messageId: string; conversationId: string; userId: string }) => void;
  onDisconnect: () => void;
}

class ChatSocketService {
  private socket: Socket | null = null;
  private componentId: string = '';
  private eventHandlers: SocketEventHandlers | null = null;
  public isRefetching: boolean = false;

  connect(token: string, conversationKey: string): Socket | null {
    this.componentId = `useChat-${conversationKey}`;
    this.socket = socketManager.getConnection(token, this.componentId);
    
    if (this.socket) {
      socketManager.registerComponent(this.componentId, [
        "connect", "onlineUser", "previousMessages", "newMessage", 
        "userTyping", "userStoppedTyping", "messagesMarkedAsRead", "chatMessageDeleted", "disconnect"
      ]);
    }
    
    return this.socket;
  }

  attachEventHandlers(handlers: SocketEventHandlers): void {
    if (!this.socket) return;
    
    this.eventHandlers = handlers;
    
    // Debug: Add catch-all event listener for private chat debugging
    this.socket.onAny((eventName: string, ...args: any[]) => {
      // Log ALL events except frequent ones, with enhanced private chat debugging
      if (!['connect', 'onlineUser', 'disconnect', 'ping', 'pong'].includes(eventName)) {
        console.log("🔌 [SOCKET] Received event:", eventName, {
          hasData: !!args[0],
          dataType: typeof args[0],
          keys: typeof args[0] === 'object' ? Object.keys(args[0]).slice(0, 10) : undefined,
          rawData: args[0] && typeof args[0] === 'object' ? JSON.stringify(args[0]).substring(0, 200) + '...' : args[0]
        });
      }
    });
    
    this.socket.on("connect", handlers.onConnect);
    this.socket.on("onlineUser", handlers.onOnlineUsers);
    this.socket.on("previousMessages", (data: any) => {
      console.log("📚 [SOCKET] Received 'previousMessages' event:", {
        messageCount: Array.isArray(data) ? data.length : 'not array',
        lastMessageId: Array.isArray(data) && data.length > 0 ? data[data.length - 1]?._id : 'none'
      });
      handlers.onPreviousMessages(data);
    });
    
    // Enhanced newMessage handler with debugging
    this.socket.on("newMessage", (data: any) => {
      console.log("📨 [SOCKET] Received 'newMessage' event:", {
        messageId: data.id || data._id || data.messageId,
        text: data.text?.substring(0, 30) || '(no text)',
        sender: data.sender || data.userId,
        isFromServer: true
      });
      handlers.onNewMessage(data);
    });
    
    // Listen for other possible message confirmation events
    this.socket.on("message", (data: any) => {
      console.log("📨 [SOCKET] Received 'message' event:", data);
      handlers.onNewMessage(data);
    });
    
    this.socket.on("messageReceived", (data: any) => {
      console.log("📨 [SOCKET] Received 'messageReceived' event:", data);
      handlers.onNewMessage(data);
    });
    
    this.socket.on("chatMessage", (data: any) => {
      console.log("📨 [SOCKET] Received 'chatMessage' event:", data);
      handlers.onNewMessage(data);
    });
    
    // Try additional event names that might be used for private chat confirmations
    this.socket.on("privateChatMessage", (data: any) => {
      console.log("📨 [SOCKET] Received 'privateChatMessage' event:", data);
      handlers.onNewMessage(data);
    });
    
    this.socket.on("chatMessageReceived", (data: any) => {
      console.log("📨 [SOCKET] Received 'chatMessageReceived' event:", data);
      handlers.onNewMessage(data);
    });
    
    this.socket.on("messageConfirmation", (data: any) => {
      console.log("📨 [SOCKET] Received 'messageConfirmation' event:", data);
      handlers.onNewMessage(data);
    });
    
    this.socket.on("chat", (data: any) => {
      console.log("📨 [SOCKET] Received 'chat' event (echo/confirmation):", data);
      handlers.onNewMessage(data);
    });
    
    this.socket.on("userTyping", (data: any) => {
      console.log("🔌 [SOCKET] Received 'userTyping' event:", {
        rawData: data,
        hasHandler: !!handlers.onUserTyping
      });
      if (handlers.onUserTyping) {
        handlers.onUserTyping(data);
      }
    });
    
    this.socket.on("userStoppedTyping", (data: any) => {
      console.log("🔌 [SOCKET] Received 'userStoppedTyping' event:", {
        rawData: data,
        hasHandler: !!handlers.onUserStoppedTyping
      });
      if (handlers.onUserStoppedTyping) {
        handlers.onUserStoppedTyping(data);
      }
    });
    this.socket.on("messagesMarkedAsRead", handlers.onMessagesMarkedAsRead);
    
    // Handle message deletion events
    if (handlers.onMessageDeleted) {
      this.socket.on("chatMessageDeleted", (data: any) => {
        console.log("🗑️ [SOCKET] Received 'chatMessageDeleted' event:", {
          messageId: data.messageId,
          conversationId: data.conversationId,
          userId: data.userId
        });
        handlers.onMessageDeleted!(data);
      });
    }
    
    this.socket.on("disconnect", handlers.onDisconnect);
  }

  joinChat(conversationDetails: ConversationDetails): void {
    if (!this.socket) return;
    
    this.socket.emit("joinChat", {
      userId: conversationDetails.userId,
      receiverId: conversationDetails.receiverId
    });
  }

  requestPreviousMessages(receiverId: string): void {
    if (!this.socket) return;
    
    this.socket.emit("getPreviousMessages", { receiverId });
  }

  sendMessage(message: any, onSent?: () => void, onError?: (error: any) => void): void {
    if (!this.socket) {
      if (onError) {
        console.log("❌ [SOCKET] No socket connection available");
        onError(new Error("No socket connection"));
      }
      return;
    }
    
    console.log("📡 [SOCKET] Emitting 'chat' event with FULL message structure:", {
      messageId: message.id,
      text: message.text?.substring(0, 30) || '(no text)',
      userId: message.userId || message.sender,
      receiver: message.receiver,
      sender: message.sender,
      fullMessageKeys: Object.keys(message),
      fullMessage: JSON.stringify(message).substring(0, 300) + '...'
    });
    
    try {
      this.socket.emit("chat", message);
      
      // Call the success callback immediately after emit (message is sent)
      if (onSent) {
        console.log("✅ [SOCKET] Message sent, calling success callback");
        onSent();
      }
    } catch (error) {
      console.log("❌ [SOCKET] Error sending message:", error);
      if (onError) {
        onError(error);
      }
    }
  }

  startTyping(conversationDetails: ConversationDetails): void {
    if (!this.socket) {
      console.log("❌ [SOCKET] Cannot send typing - no socket connection");
      return;
    }
    
    const typingData = {
      conversationId: `${conversationDetails.userId}-${conversationDetails.receiverId}`,
      userId: conversationDetails.userId,
      receiverId: conversationDetails.receiverId
    };
    
    console.log("⌨️ [SOCKET] Sending 'typing' event:", typingData);
    this.socket.emit("typing", typingData);
  }

  stopTyping(conversationDetails: ConversationDetails): void {
    if (!this.socket) {
      console.log("❌ [SOCKET] Cannot send stop typing - no socket connection");
      return;
    }
    
    const stopTypingData = {
      conversationId: `${conversationDetails.userId}-${conversationDetails.receiverId}`,
      userId: conversationDetails.userId,
      receiverId: conversationDetails.receiverId
    };
    
    console.log("⌨️ [SOCKET] Sending 'stopTyping' event:", stopTypingData);
    this.socket.emit("stopTyping", stopTypingData);
  }

  markMessagesAsRead(conversationDetails: ConversationDetails): void {
    if (!this.socket) return;
    
    this.socket.emit("markMessagesAsRead", {
      conversationId: `${conversationDetails.userId}-${conversationDetails.receiverId}`,
      userId: conversationDetails.userId,
      receiverId: conversationDetails.receiverId
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  disconnect(): void {
    if (!this.socket || !this.eventHandlers) return;

    this.socket.off("connect", this.eventHandlers.onConnect);
    this.socket.off("onlineUser", this.eventHandlers.onOnlineUsers);
    this.socket.off("previousMessages", this.eventHandlers.onPreviousMessages);
    this.socket.off("newMessage", this.eventHandlers.onNewMessage);
    this.socket.off("message", this.eventHandlers.onNewMessage);
    this.socket.off("messageReceived", this.eventHandlers.onNewMessage);
    this.socket.off("chatMessage", this.eventHandlers.onNewMessage);
    this.socket.off("privateChatMessage", this.eventHandlers.onNewMessage);
    this.socket.off("chatMessageReceived", this.eventHandlers.onNewMessage);
    this.socket.off("messageConfirmation", this.eventHandlers.onNewMessage);
    this.socket.off("chat", this.eventHandlers.onNewMessage);
    this.socket.off("userTyping", this.eventHandlers.onUserTyping);
    this.socket.off("userStoppedTyping", this.eventHandlers.onUserStoppedTyping);
    this.socket.off("messagesMarkedAsRead", this.eventHandlers.onMessagesMarkedAsRead);
    this.socket.off("disconnect", this.eventHandlers.onDisconnect);

    if (this.componentId) {
      socketManager.unregisterComponent(this.componentId);
    }

    this.socket = null;
    this.eventHandlers = null;
    this.componentId = '';
  }
}

export const createChatSocketService = (): ChatSocketService => {
  return new ChatSocketService();
};