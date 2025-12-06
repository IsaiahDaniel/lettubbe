import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import Constants from "expo-constants";

import { Alert, Platform } from "react-native";
import { useCustomAlert } from "@/hooks/useCustomAlert";

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

const usePushNotifications = (): PushNotificationState => {
  const { showAlert } = useCustomAlert();

  const [expoPushToken, setExpoPushToken] = useState<
    Notifications.ExpoPushToken | undefined
  >();

  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >();
  
  // Track if we've already tried to register to prevent multiple attempts
  const registrationAttemptedRef = useRef(false);

  //  @deprecated — use the EventSubscription
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      console.log('Notification permission status:', existingStatus);


      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        // Add a small delay to ensure AlertProvider is ready
        setTimeout(() => {
          showAlert({
            title: "Enable Notifications",
            message: "Stay connected! Enable notifications to get updates on likes, comments, live streams, and messages from your friends.",
            primaryButton: {
              text: "Allow Notifications",
              onPress: async () => {
                // Request permissions again
                const { status } = await Notifications.requestPermissionsAsync();
                if (status === "granted") {
                  console.log("User granted notifications on second attempt");
                  // Get the push token now
                  const token = await Notifications.getExpoPushTokenAsync({
                    projectId: Constants.expoConfig?.extra?.eas.projectId,
                  });
                  setExpoPushToken(prevToken => {
                    if (prevToken?.data !== token?.data) {
                      return token;
                    }
                    return prevToken;
                  });
                }
              }
            },
            secondaryButton: {
              text: "Maybe Later",
              onPress: () => {
                console.log("User chose to skip notifications");
              }
            }
          });
        }, 1000);
        return;
      }

      token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas.projectId,
      });


      // try {
      //   const token = await Notifications.getExpoPushTokenAsync({
      //     projectId: Constants.expoConfig?.extra?.eas.projectId,
      //   });
      //   console.log('Push token:', token);
      // } catch (error) {
      //   console.error('Error getting push token:', error);
      // }

    } else {
      // alert("Must be using a physical device for Push notifications");
      console.log("Must be using a physical device for Push notifications");
    }

    // if (Platform.OS === "android") {
    //   Notifications.setNotificationChannelAsync("default", {
    //     name: "default",
    //     importance: Notifications.AndroidImportance.MAX,
    //     vibrationPattern: [0, 250, 250, 250],
    //     lightColor: "#FF231F7C",
    //   });
    // }

    return token;
  }

  useEffect(() => {
    // Prevent multiple registration attempts that cause state oscillation
    if (registrationAttemptedRef.current) {
      return;
    }
    registrationAttemptedRef.current = true;

    registerForPushNotificationsAsync().then((token) => {
      // Only update state if token actually changed to prevent unnecessary re-renders
      setExpoPushToken(prevToken => {
        if (prevToken?.data !== token?.data) {
          return token;
        }
        return prevToken;
      });
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }

      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
};

export default usePushNotifications;