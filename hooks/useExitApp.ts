import { useCallback } from "react";
import { BackHandler, ToastAndroid, Platform, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const useExitApp = () => {
  useFocusEffect(
    useCallback(() => {
      let backPressedOnce = false;

      const onBackPress = () => {
        if (backPressedOnce) {
          BackHandler.exitApp();
          return true;
        }

        backPressedOnce = true;

        if (Platform.OS === "android") {
          ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
        } else {
          Alert.alert("Exit App", "Press back again to exit");
        }

        setTimeout(() => {
          backPressedOnce = false;
        }, 2000);

        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [])
  );
};

export default useExitApp;