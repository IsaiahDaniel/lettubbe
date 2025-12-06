import { View, Text, Image } from "react-native";
import React from "react";
import { Icons, Images } from "@/constants";
import Typography from "../ui/Typography/Typography";

type EmptyListProps = {
    text?: string;
};

const EmptyList = ({ text }: EmptyListProps) => {
  return (
    <View>
      <Image source={Icons.EmptyImageIcon} />
      {text && <Typography>{text}</Typography>}
    </View>
  );
};

export default EmptyList;
