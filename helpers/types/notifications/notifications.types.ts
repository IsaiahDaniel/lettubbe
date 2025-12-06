import * as Notifications from "expo-notifications";

export interface IPushNotificationState {
    notification?: Notifications.Notification;
    expoPushToken?: Notifications.ExpoPushToken;   
}