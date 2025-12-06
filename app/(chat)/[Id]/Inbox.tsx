import React from "react";
import { InboxScreen, InboxErrorBoundary } from "@/components/shared/chat/inbox";
import { useLocalSearchParams } from "expo-router";
import useAuth from "@/hooks/auth/useAuth";

const Inbox = () => {
  const searchParams = useLocalSearchParams();
  const { token: authToken } = useAuth();
  
  // Handle token being an object or string
  const token = typeof authToken === 'string' ? authToken : 
                typeof authToken === 'object' && authToken ? authToken.toString() : 
                null;

  // Parameter extraction with null guards
  const chatId = searchParams.Id?.toString() || '';
  const userId = searchParams.userId?.toString() || '';

  // console.log("🔧 [INBOX] Auth token type:", typeof authToken, authToken ? 'present' : 'missing');
  // console.log("🔧 [INBOX] Processed token:", token ? 'present' : 'missing');
  // console.log("🔧 [INBOX] Params:", { chatId, userId });
  // console.log("🔧 [INBOX] Component render at:", Date.now());

  return (
    <InboxErrorBoundary>
      <InboxScreen />
    </InboxErrorBoundary>
  );
};

export default Inbox;
