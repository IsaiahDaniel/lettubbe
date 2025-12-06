import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import { DateRange } from "@/helpers/types/comments/Types";


interface DateRangeIndicatorProps {
  dateRange: DateRange;
  openDateRangePicker: () => void;
}

const DateRangeIndicator: React.FC<DateRangeIndicatorProps> = ({ dateRange, openDateRangePicker }) => {
  if (!dateRange.from || !dateRange.to) return null;
  
  return (
    <View style={styles.dateRangeIndicator}>
      <Typography size={12} color={Colors.general.primary}>
        Showing comments from {dateRange.from.toLocaleDateString()} to {dateRange.to.toLocaleDateString()}
      </Typography>
      <TouchableOpacity onPress={openDateRangePicker}>
        <Feather name="edit-2" size={14} color={Colors.general.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  dateRangeIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    borderRadius: 5,
    marginBottom: 10,
  },
});

export default DateRangeIndicator;