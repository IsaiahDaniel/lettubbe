import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Typography from './Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';

interface SlidingDatePickerProps {
  isVisible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  initialDate?: Date | null;
  minimumDate?: Date;
  maximumDate?: Date;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const SlidingDatePicker: React.FC<SlidingDatePickerProps> = ({
  isVisible,
  onClose,
  onDateSelect,
  initialDate,
  minimumDate = new Date(1900, 0, 1),
  maximumDate = new Date(),
}) => {
  const { theme } = useCustomTheme();
  const slideAnimation = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnimation = useRef(new Animated.Value(0)).current;

  // Current date components
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  // Initialize with provided initial date or defaults
  const [selectedDay, setSelectedDay] = useState(initialDate?.getDate() || today.getDate());
  const [selectedMonth, setSelectedMonth] = useState(initialDate?.getMonth() || today.getMonth());
  const [selectedYear, setSelectedYear] = useState(initialDate?.getFullYear() || today.getFullYear());

  // Generate arrays for each column
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from(
    { length: maximumDate.getFullYear() - minimumDate.getFullYear() + 1 },
    (_, i) => minimumDate.getFullYear() + i
  ).reverse(); // Most recent years first

  // Get days for selected month/year
  const getDaysInMonth = (month: number, year: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const days = getDaysInMonth(selectedMonth, selectedYear);

  // Scroll animations for each column
  const dayScrollY = useRef(new Animated.Value(0)).current;
  const monthScrollY = useRef(new Animated.Value(0)).current;
  const yearScrollY = useRef(new Animated.Value(0)).current;

  // Update day if it's invalid for the selected month/year
  useEffect(() => {
    const maxDay = getDaysInMonth(selectedMonth, selectedYear).length;
    if (selectedDay > maxDay) {
      setSelectedDay(maxDay);
    }
  }, [selectedMonth, selectedYear]);

  // Animate modal appearance
  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const createPanResponder = (
    items: any[],
    getSelectedIndex: () => number,
    setSelected: (value: any) => void,
    scrollY: Animated.Value
  ) => {
    let startY = 0;
    
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Store the current scroll position when starting gesture
        const selectedIndex = getSelectedIndex();
        startY = -selectedIndex * ITEM_HEIGHT;
      },
      onPanResponderMove: (_, gestureState) => {
        // Update scroll position based on gesture
        const newY = startY + gestureState.dy;
        scrollY.setValue(newY);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Calculate final position
        const finalY = startY + gestureState.dy;
        const targetIndex = Math.round(-finalY / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(items.length - 1, targetIndex));
        
        // Update selected value
        setSelected(items[clampedIndex]);
        
        // Animate to final position
        Animated.spring(scrollY, {
          toValue: -clampedIndex * ITEM_HEIGHT,
          tension: 100,
          friction: 8,
          useNativeDriver: false,
        }).start();
      },
    });
  };

  const dayPanResponder = createPanResponder(
    days,
    () => days.indexOf(selectedDay),
    setSelectedDay,
    dayScrollY
  );

  const monthPanResponder = createPanResponder(
    months.map((_, index) => index),
    () => selectedMonth,
    setSelectedMonth,
    monthScrollY
  );

  const yearPanResponder = createPanResponder(
    years,
    () => years.indexOf(selectedYear),
    setSelectedYear,
    yearScrollY
  );

  // Set initial scroll positions
  useEffect(() => {
    if (isVisible) {
      dayScrollY.setValue(-days.indexOf(selectedDay) * ITEM_HEIGHT);
      monthScrollY.setValue(-selectedMonth * ITEM_HEIGHT);
      yearScrollY.setValue(-years.indexOf(selectedYear) * ITEM_HEIGHT);
    }
  }, [isVisible, selectedDay, selectedMonth, selectedYear]);

  const handleConfirm = () => {
    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
    onDateSelect(selectedDate);
    onClose();
  };

  const renderColumn = (
    items: any[],
    selectedValue: any,
    scrollY: Animated.Value,
    panResponder: any,
    formatItem?: (item: any) => string
  ) => {
    return (
      <View style={styles.column}>
        <View style={styles.columnContainer}>
          <Animated.View
            style={[
              styles.scrollContainer,
              {
                transform: [{ translateY: scrollY }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            {items.map((item, index) => {
              const isSelected = item === selectedValue;
              return (
                <View key={index} style={styles.item}>
                  <Typography
                    size={18}
                    weight={isSelected ? '600' : '400'}
                    color={
                      isSelected
                        ? Colors[theme].textBold
                        : Colors[theme].textLight
                    }
                    style={[
                      styles.itemText,
                      {
                        opacity: isSelected ? 1 : 0.5,
                        transform: [
                          {
                            scale: isSelected ? 1.1 : 1,
                          },
                        ],
                      },
                    ]}
                  >
                    {formatItem ? formatItem(item) : item}
                  </Typography>
                </View>
              );
            })}
          </Animated.View>
        </View>
        
        {/* Selection indicator */}
        <View style={[styles.selectionIndicator, { backgroundColor: Colors[theme].borderColor }]} />
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnimation,
            },
          ]}
        />
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Date Picker Container */}
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: Colors[theme].background,
              transform: [{ translateY: slideAnimation }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Typography size={16} color={Colors[theme].textLight}>
                Cancel
              </Typography>
            </TouchableOpacity>
            
            <Typography
              size={18}
              weight="600"
              color={Colors[theme].textBold}
            >
              Select Date
            </Typography>
            
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Typography size={16} weight="600" color={Colors.general.primary}>
                Done
              </Typography>
            </TouchableOpacity>
          </View>

          {/* Date Picker */}
          <View style={styles.pickerContainer}>
            {/* Month Column */}
            {renderColumn(
              months.map((_, index) => index),
              selectedMonth,
              monthScrollY,
              monthPanResponder,
              (monthIndex) => months[monthIndex]
            )}

            {/* Day Column */}
            {renderColumn(
              days,
              selectedDay,
              dayScrollY,
              dayPanResponder
            )}

            {/* Year Column */}
            {renderColumn(
              years,
              selectedYear,
              yearScrollY,
              yearPanResponder
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButton: {
    padding: 5,
  },
  confirmButton: {
    padding: 5,
  },
  pickerContainer: {
    flexDirection: 'row',
    height: PICKER_HEIGHT,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  column: {
    flex: 1,
    position: 'relative',
  },
  columnContainer: {
    height: PICKER_HEIGHT,
    overflow: 'hidden',
  },
  scrollContainer: {
    paddingVertical: ITEM_HEIGHT * 2,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    textAlign: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 10,
    right: 10,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    opacity: 0.1,
    pointerEvents: 'none',
  },
});

export default SlidingDatePicker;