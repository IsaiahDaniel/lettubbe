import { useMutation } from "@tanstack/react-query";
import { getSocket } from "../../helpers/utils/socket";
import useAuth from "../auth/useAuth";
import { deleteCommunityChatMessage } from "@/services/chats.service";
import { handleError } from "@/helpers/utils/handleError";

const useDeleteGroupMessage = (messageId: any, groupId: any, setMessages?: any) => {
  const { token } = useAuth();

  const { mutate, isPending, isError, error } = useMutation({
    mutationKey: ["deleteGroupChatMessage"],
    mutationFn: (messageId: any) => {
      console.log("🗑️ Starting delete message API call for messageId:", messageId);
      return deleteCommunityChatMessage(messageId);
    },
    networkMode: "always",
    onSuccess: (data, messageId) => {
      console.log("✅ Delete message API call successful:", data);
      // Emit delete event to WebSocket
      const socket = getSocket(token);
      console.log("📡 Emitting deleteGroupMessage event with:", { messageId, groupId });
      if(socket){
        socket.emit("deleteGroupMessage", { messageId, groupId });
      }
    },
    onError: (error) => {
      console.error("❌ Delete message API call failed:", error);
      handleError(error);
    }
  });

  const handleDeleteChat = () => {
    console.log("🗑️ HandleDeleteChat called with messageId:", messageId, "groupId:", groupId);
    if (!messageId) {
      console.warn("⚠️ No messageId provided, aborting delete");
      return;
    }
    
    // Optimistic update - immediately mark message as deleted in UI
    if (setMessages) {
      console.log("⚡ Optimistic update: marking message as deleted immediately");
      setMessages((prevMessages: any[]) =>
        prevMessages.map((msg: any) =>
          msg._id === messageId ? { ...msg, text: "Message was deleted", isDeleted: true } : msg
        )
      );
    }
    
    console.log("🚀 Triggering delete mutation...");
    mutate(messageId);
  };

  return {
    isPending,
    handleDeleteChat,
  };
};

export default useDeleteGroupMessage;