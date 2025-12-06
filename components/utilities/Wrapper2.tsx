import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemedView } from "../ThemedView";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors } from "@/constants";
import SafeAreaView from "react-native-safe-area-view";
import NetworkError from "../shared/NetworkError";
import { View } from "react-native";
import { errorStyles } from "@/styles/ErrorStyles";

type WrapperProps = {
  children: React.ReactNode;
  isError?: boolean;
  error?: any;
  refetch?: any;
};

const Wrapper = ({ children, isError, error, refetch }: WrapperProps) => {
  const { theme } = useCustomTheme();

  if (isError) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View style={errorStyles.container}>
          <View style={errorStyles.errorContainer}>
            <NetworkError refetch={refetch} error={error} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView
          forceInset={{ top: "always" }}
          style={{ width: "100%", flex: 1, position: "relative" }}
        >
          {children}
        </SafeAreaView>
        <StatusBar
          backgroundColor={Colors[theme].background}
          style={theme === "dark" ? "light" : "dark"}
        />
      </SafeAreaProvider>
    </ThemedView>
  );
};

export default Wrapper;
