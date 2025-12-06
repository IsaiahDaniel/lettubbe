import useVideoUploadStore from "@/store/videoUploadStore";
import { useState } from "react";

const useChatPicker = (chatType: "community" | "chat" | null) => {
  const [showPicker, setShowPicker] = useState(false);

  const { chatUploadType, setChatUploadType } = useVideoUploadStore();

  // Log state changes
  const loggedSetShowPicker = (value: boolean | ((prev: boolean) => boolean)) => {
    setShowPicker((prev) => {
      const newValue = typeof value === 'function' ? value(prev) : value;
      if (prev !== newValue) {
        console.log("🎯 [CHAT_PICKER] State change:", {
          from: prev,
          to: newValue,
          timestamp: Date.now()
        });
      }
      return newValue;
    });
  };

  const togglePicker = () => {
    console.log("🎯 [CHAT_PICKER] togglePicker called:", {
      currentState: showPicker,
      willBecome: !showPicker,
      chatType,
      timestamp: Date.now(),
      stackTrace: new Error().stack?.split('\n').slice(1, 4)
    });
    loggedSetShowPicker((prev) => !prev);
  };

  const openPicker = () => {
    console.log("🎯 [CHAT_PICKER] openPicker called:", {
      chatType,
      timestamp: Date.now()
    });
    setChatUploadType(chatType);
    loggedSetShowPicker(true);
  };

  const closePicker = () => {
    console.log("🎯 [CHAT_PICKER] closePicker called:", {
      timestamp: Date.now()
    });
    setChatUploadType(null);
    loggedSetShowPicker(false);
  };

  return {
    showPicker,
    chatUploadType,
    setChatUploadType,
    setShowPicker,
    togglePicker,
    openPicker,
    closePicker,
    isPickerOpen: showPicker,
  };
};

export default useChatPicker;
