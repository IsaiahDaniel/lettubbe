import { useMutation } from "@tanstack/react-query";
import { getSocket } from "../../helpers/utils/socket";
import useAuth from "../auth/useAuth";
import { deleteConversationMessage } from "@/services/chats.service";
import { handleError } from "@/helpers/utils/handleError";

const useDeleteInboxMessage = (messageId: any, conversationId: any, setMessages?: any) => {
  const { token, userDetails } = useAuth();

  const { mutate, isPending, isError, error } = useMutation({
    mutationKey: ["deleteInboxChatMessage"],
    mutationFn: (messageId: any) => {
      const userId = userDetails?._id || userDetails?.id;
      console.log("🗑️ Starting delete conversation message API call for conversationId:", conversationId, "messageId:", messageId, "userId:", userId);
      return deleteConversationMessage(conversationId, messageId, userId);
    },
    networkMode: "always",
    onSuccess: (data, messageId) => {
      console.log("✅ Delete message API call successful:", data);
      // Emit delete event to WebSocket
      const socket = getSocket(token);
      console.log("📡 Emitting deleteInboxMessage event with:", { messageId, conversationId });
      if(socket){
        socket.emit("deleteInboxMessage", { messageId, conversationId });
      }
    },
    onError: (error) => {
      console.error("❌ Delete message API call failed:", error);
      handleError(error);
    }
  });

  const handleDeleteChat = (messageIdToDelete: string) => {
    console.log("🗑️ HandleDeleteChat called with messageId:", messageIdToDelete, "conversationId:", conversationId);
    if (!messageIdToDelete) {
      console.warn("⚠️ No messageId provided, aborting delete");
      return;
    }
    
    // Optimistic update - immediately mark message as deleted in UI
    if (setMessages) {
      console.log("⚡ Optimistic update: marking message as deleted immediately");
      setMessages((prevMessages: any[]) =>
        prevMessages.map((msg: any) => {
          const msgId = msg._id || msg.id;
          return msgId === messageIdToDelete ? { ...msg, text: "Message was deleted", isDeleted: true } : msg;
        })
      );
    }
    
    console.log("🚀 Triggering delete mutation...");
    mutate(messageIdToDelete);
  };

  return {
    isPending,
    handleDeleteChat,
  };
};

export default useDeleteInboxMessage;