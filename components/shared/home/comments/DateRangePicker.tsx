import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors } from "@/constants";
import Typography from "@/components/ui/Typography/Typography";
import { useCustomTheme } from "@/hooks/useCustomTheme";

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (from: Date, to: Date) => void;
  minDate: Date;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  visible,
  onClose,
  onApply,
  minDate,
}) => {
  const [fromDate, setFromDate] = useState<Date>(new Date(minDate));
  const [toDate, setToDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<"from" | "to">("from");
  const { theme } = useCustomTheme();

  // Platform-specific picker handling
  const [showFromPicker, setShowFromPicker] = useState<boolean>(
    Platform.OS === "ios"
  );
  const [showToPicker, setShowToPicker] = useState<boolean>(false);

  const handleConfirm = () => {
    onApply(fromDate, toDate);
    onClose();
  };

  // Platform-specific date picker handlers
  const handleFromDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowFromPicker(false); // Hide picker after selection on Android
    }

    if (selectedDate) {
      const currentDate = selectedDate || fromDate;
      // Ensure fromDate is not before minDate and not after toDate
      if (currentDate >= new Date(minDate) && currentDate <= toDate) {
        setFromDate(currentDate);
      }
    }
  };

  const handleToDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowToPicker(false); // Hide picker after selection on Android
    }

    if (selectedDate) {
      const currentDate = selectedDate || toDate;
      // Ensure toDate is not before fromDate and not after today
      if (currentDate >= fromDate && currentDate <= new Date()) {
        setToDate(currentDate);
      }
    }
  };

  // Tab selection handlers that properly toggle pickers based on platform
  const selectFromTab = () => {
    setActiveTab("from");
    if (Platform.OS === "android") {
      setShowFromPicker(true);
      setShowToPicker(false);
    }
  };

  const selectToTab = () => {
    setActiveTab("to");
    if (Platform.OS === "android") {
      setShowToPicker(true);
      setShowFromPicker(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: Colors[theme].cardBackground },
          ]}
        >
          <Typography weight="600" size={18} style={styles.modalTitle}>
            Select Date Range
          </Typography>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "from" && styles.activeTab]}
              onPress={selectFromTab}
            >
              <Typography
                weight="500"
                color={activeTab === "from" ? Colors.general.primary : "#888"}
              >
                From: {fromDate.toLocaleDateString()}
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "to" && styles.activeTab]}
              onPress={selectToTab}
            >
              <Typography
                weight="500"
                color={activeTab === "to" ? Colors.general.primary : "#888"}
              >
                To: {toDate.toLocaleDateString()}
              </Typography>
            </TouchableOpacity>
          </View>

          {/* iOS displays pickers inline, Android needs conditional rendering */}
          {Platform.OS === "ios" ? (
            // iOS always shows the picker inline based on activeTab
            activeTab === "from" ? (
              <DateTimePicker
                value={fromDate}
                mode="date"
                display="spinner"
                onChange={handleFromDateChange}
                minimumDate={new Date(minDate)}
                maximumDate={toDate}
              />
            ) : (
              <DateTimePicker
                value={toDate}
                mode="date"
                display="spinner"
                onChange={handleToDateChange}
                minimumDate={fromDate}
                maximumDate={new Date()}
              />
            )
          ) : (
            // Android shows pickers as dialogs
            <>
              {showFromPicker && (
                <DateTimePicker
                  value={fromDate}
                  mode="date"
                  display="default"
                  onChange={handleFromDateChange}
                  minimumDate={new Date(minDate)}
                  maximumDate={toDate}
                />
              )}
              {showToPicker && (
                <DateTimePicker
                  value={toDate}
                  mode="date"
                  display="default"
                  onChange={handleToDateChange}
                  minimumDate={fromDate}
                  maximumDate={new Date()}
                />
              )}
            </>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Typography weight="500" color="#888">
                Cancel
              </Typography>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.applyButton]}
              onPress={handleConfirm}
            >
              <Typography weight="500" color="#fff">
                Apply
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: Colors.general.primary,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f2f2f2",
  },
  applyButton: {
    backgroundColor: Colors.general.primary,
  },
});

export default DateRangePicker;
