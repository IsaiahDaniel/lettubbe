import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import {
  subscribeToUser,
  unsubscribeFromUser,
} from "@/services/profile.service";

interface UseSubscriptionProps {
  initialIsSubscribed?: boolean;
  initialSubscriberCount?: number;
  onSubscriptionChange?: (
    isSubscribed: boolean,
    subscriberCount: number
  ) => void;
}

interface UseSubscriptionResult {
  isSubscribed: boolean;
  subscriberCount: number;
  isLoading: boolean;
  handleSubscribe: (userId: string) => Promise<void>;
  handleUnsubscribe: (userId: string) => Promise<void>;
}

const useSubscription = ({
  initialIsSubscribed = false,
  initialSubscriberCount = 0,
  onSubscriptionChange,
}: UseSubscriptionProps = {}): UseSubscriptionResult => {
  const [isSubscribed, setIsSubscribed] =
    useState<boolean>(initialIsSubscribed);
  const [subscriberCount, setSubscriberCount] = useState<number>(
    initialSubscriberCount
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Update state when props change
  useEffect(() => {
    // console.log("useSubscription: Updating state with initial values:", {
    //   initialIsSubscribed,
    //   initialSubscriberCount,
    // });
    setIsSubscribed(initialIsSubscribed);
    setSubscriberCount(initialSubscriberCount);
  }, [initialIsSubscribed, initialSubscriberCount]);

  // Handle subscribing to a user
  const handleSubscribe = useCallback(
    async (userId: string): Promise<void> => {
      if (!userId || isLoading) return;

      try {
        setIsLoading(true);
        const response = await subscribeToUser(userId);

        console.log("Subscribe API response:", response);

        if (response?.success) {
          const newSubscriberCount = subscriberCount + 1;
          setIsSubscribed(true);
          setSubscriberCount(newSubscriberCount);

          if (onSubscriptionChange) {
            onSubscriptionChange(true, newSubscriberCount);
          }

          console.log("Successfully subscribed to:", userId);
        } else {
          Alert.alert(
            "Subscription Error",
            response?.message || "Could not subscribe at this time."
          );
          return Promise.reject(new Error("Subscription failed"));
        }
      } catch (error) {
        console.error("Error subscribing to user:", error);
        Alert.alert(
          "Subscription Error",
          "Failed to subscribe. Please try again later."
        );
        return Promise.reject(error);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, subscriberCount, onSubscriptionChange]
  );

  //Handle unsubscribing from a user
  const handleUnsubscribe = useCallback(
    async (userId: string): Promise<void> => {
      if (!userId || isLoading) return;

      try {
        setIsLoading(true);
        const response = await unsubscribeFromUser(userId);

        console.log("Unsubscribe API response:", response);

        if (response?.success) {
          const newSubscriberCount = Math.max(0, subscriberCount - 1);
          setIsSubscribed(false);
          setSubscriberCount(newSubscriberCount);

          if (onSubscriptionChange) {
            onSubscriptionChange(false, newSubscriberCount);
          }

          console.log("Successfully unsubscribed from:", userId);
        } else {
          Alert.alert(
            "Unsubscription Error",
            response?.message || "Could not unsubscribe at this time."
          );
          return Promise.reject(new Error("Unsubscription failed"));
        }
      } catch (error) {
        console.error("Error unsubscribing from user:", error);
        Alert.alert(
          "Unsubscription Error",
          "Failed to unsubscribe. Please try again later."
        );
        return Promise.reject(error);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, subscriberCount, onSubscriptionChange]
  );

  return {
    isSubscribed,
    subscriberCount,
    isLoading,
    handleSubscribe,
    handleUnsubscribe,
  };
};

export default useSubscription;
