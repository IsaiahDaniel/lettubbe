import React, { useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import {
  Menu,
  MenuTrigger,
  MenuOptions,
  MenuOption,
} from "react-native-popup-menu";
import { Colors, Icons } from "@/constants";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import Typography from "./Typography/Typography";

type AppMenuProps = {
  trigger: (isOpen: boolean) => React.ReactNode;
  options: {
    name: string;
    des?: React.ReactNode;
    available?: boolean;
    info?: string;
    textStyle?: {
      color: string;
    };
  }[];
  selectedOption: string;
  onSelect: (option: string) => void;
  width?: string | number;
  title?: string;
};

const AppMenu = ({
  trigger,
  options,
  selectedOption,
  onSelect,
  width = 250,
  title,
}: AppMenuProps) => {
  const { theme } = useCustomTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Menu onOpen={() => setIsOpen(true)} onClose={() => setIsOpen(false)}>
      <MenuTrigger>{trigger(isOpen)}</MenuTrigger>

      <MenuOptions
        customStyles={{
          optionsContainer: {
            borderRadius: 8,
            padding: 10,
            backgroundColor: Colors[theme].cardBackground,
            width: width as number,
            zIndex: 9999,
            elevation: 6,
          },
        }}
      >
        {title && (
          <Typography
            weight="700"
            size={14}
            lineHeight={24}
            style={{ marginBottom: 12 }}
          >
            {title}
          </Typography>
        )}
        {options.map((option) => (
          <MenuOption
            key={option.name}
            onSelect={() =>
              option.available !== false ? onSelect(option.name) : null
            }
          >
            <View
              style={[
                styles.menuOption,
                { opacity: option.available !== false ? 1 : 0.4 },
              ]}
            >
              <View style={{ width: "80%" }}>
                <Typography
                  weight="500"
                  size={13}
                  lineHeight={24}
                  textType="textBold"
                  style={option.textStyle}
                >
                  {option.name}
                </Typography>
                {option.des && <Typography>{option.des}</Typography>}
                {option.available === false && (
                  <View style={{ flexDirection: "row", gap: 4, marginTop: 5 }}>
                    <Typography size={12}>
                      This feature is not available yet
                    </Typography>
                  </View>
                )}
              </View>
            </View>
          </MenuOption>
        ))}
      </MenuOptions>
    </Menu>
  );
};

const styles = StyleSheet.create({
  menuOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    width: "100%",
  },
});

export default AppMenu;