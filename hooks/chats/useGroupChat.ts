import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { FlatList } from "react-native";
import { getSocket } from "../../helpers/utils/socket";
import useAuth from "../auth/useAuth";

interface Message {
  text: string;
  userId: string;
}

const useGroupChat = (groupId: string, discussionId: string) => {
  // const { usersOnline, setUsersOnline } = useGetOnlineUsersState();
  const { token, userDetails: user } = useAuth();

  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(true);
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // const currentMessage = useRef<any>(null);
  // console.log("token", token);

  useEffect(() => {
    if (!token) return;

    console.log("Connecting to socket with token:", token);
    const socket: Socket = getSocket(token);

    socket.on("connect", () => {
      console.log("✅ Connected to WebSocket:", socket.id);
      socket.emit("joinGroup", groupId);
    });

    socket.on("onlineUser", (data) => {
      console.log("Received online users:", data);
      // setUsersOnline(data);
    });

    socket.emit("getPreviousGroupMessages", { groupId, discussionId });

    socket.on("newGroupMessage", (newMessage) => {
      console.log("📩 New chat received Group Message:", newMessage);

      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    socket.on("previousGroupMessages", (data: Message[]) => {
      // console.log("📩 New chat received:",  data);
      // console.log(
      //   "📩 New chat received Previous:",
      //   JSON.stringify(data, null, 2)
      // );

      // setMessages((prevMessages) => [...prevMessages, data]);
      setMessages((prevMessages) => [...prevMessages, ...data]);

      setLoadingMessages(false);
    });

    // socket.on("disconnect", (error) => {
    //   console.log("❌ Disconnected from WebSocket", error);
    // });

    return () => {
      socket.disconnect();
    };
  }, [token, groupId]);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;

    const socketConnection = getSocket(token);

    console.log("message", chatMessage);

    if (socketConnection) {
      const newMessage = {
        sender: user._id,
        groupId,
        text: chatMessage,
        userId: user._id,
        discussionId: discussionId,
      };

      console.log("📨 Sending chat message:", newMessage);

      // Emit the message
      socketConnection.emit("GroupChat", newMessage);

      setChatMessage(""); 
    }
  };

  // const handleSendComment = () => {
  //   if (!chatMessage.trim()) return;

  //   const newMessage = {
  //     id: new Date().getTime().toString(),
  //     name: user.firstName,
  //     message: chatMessage,
  //     isSender: true,
  //     repliedTo: replyMessage
  //       ? { name: replyMessage.name, message: replyMessage.message }
  //       : null,
  //   };

  //   // Call the existing send message function
  //   sendMessage(newMessage);

  //   // Reset state
  //   setChatMessage("");
  //   setReplyMessage(null);
  // };

  return {
    // usersOnline,
    handleSendChat,
    flatListRef,
    // currentMessage,
    chatMessage,
    setChatMessage,
    loadingMessages,
    messages,
    user,
    replyMessage,
    setReplyMessage,
  };
};

export default useGroupChat;
