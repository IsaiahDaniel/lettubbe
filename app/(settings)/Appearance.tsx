import { View, TouchableOpacity } from "react-native";
import React from "react";
import Wrapper from "@/components/utilities/Wrapper";
import BackButton from "@/components/utilities/BackButton";
import Typography from "@/components/ui/Typography/Typography";
import { Colors } from "@/constants";
import { useThemeStore, ThemeType } from "@/store/ThemeStore";
import { Ionicons } from "@expo/vector-icons";

const Appearance = () => {
  const { selectedTheme, resolvedTheme, setTheme } = useThemeStore();

  const themeOptions: {
    value: ThemeType;
    label: string;
    description: string;
  }[] = [
    { value: "light", label: "Light", description: "Always use light theme" },
    { value: "dark", label: "Dark", description: "Always use dark theme" },
    {
      value: "system",
      label: "System",
      description: "Match your device settings",
    },
  ];

  const handleThemeChange = (theme: ThemeType) => {
    setTheme(theme);
  };

  return (
    <Wrapper>
      <View style={{flexDirection: "row", gap: 14, alignItems: "center", marginTop: 12}}>
        <BackButton />
        <Typography
          weight="700"
          size={18}
          color={Colors[resolvedTheme].textBold}
        >
          Appearance
        </Typography>
      </View>

      <View style={{ marginTop: 20 }}>
        <Typography
          weight="400"
          size={14}
          color={Colors[resolvedTheme].textLight}
          style={{ marginBottom: 12 }}
        >
          Choose how the app looks to you
        </Typography>

        <View style={{ gap: 16 }}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleThemeChange(option.value)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: selectedTheme === option.value ? 2 : 1,
                borderColor:
                  selectedTheme === option.value
                    ? Colors.general.primary
                    : Colors[resolvedTheme].borderColor,
              }}
            >
              <View style={{ flex: 1 }}>
                <Typography
                  weight="600"
                  size={14}
                  color={Colors[resolvedTheme].textBold}
                  style={{ marginBottom: 4 }}
                >
                  {option.label}
                </Typography>

                <Typography
                  weight="400"
                  size={12}
                  color={Colors[resolvedTheme].textLight}
                >
                  {option.description}
                </Typography>
              </View>

              {selectedTheme === option.value && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={Colors.general.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* <View 
          style={{
            marginTop: 32,
            padding: 16,
            backgroundColor: Colors[resolvedTheme].cardBackground,
            borderRadius: 12,
          }}
        >
          <Typography 
            weight="600" 
            size={14} 
            color={Colors[resolvedTheme].text}
            style={{ marginBottom: 8 }}
          >
            Preview
          </Typography>
          
          <View 
            style={{
              padding: 16,
              backgroundColor: Colors[resolvedTheme].background,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: Colors[resolvedTheme].borderColor,
            }}
          >
            <Typography 
              weight="600" 
              size={14} 
              color={Colors[resolvedTheme].textBold}
              style={{ marginBottom: 4 }}
            >
              Sample Text
            </Typography>
            
            <Typography 
              weight="400" 
              size={12} 
              color={Colors[resolvedTheme].textLight}
            >
              This is how your app will look with the selected theme
            </Typography>
          </View>
        </View> */}
      </View>
    </Wrapper>
  );
};

export default Appearance;
