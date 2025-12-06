import React from 'react';
import { View, StyleSheet } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface DateSeparatorProps {
  date: string;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const { theme } = useCustomTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: Colors[theme].borderColor }]} />
      <View style={[styles.dateContainer]}>
        <Typography
          size={12}
          weight="500"
          color={Colors[theme].textLight}
          style={styles.dateText}
        >
          {date}
        </Typography>
      </View>
      <View style={[styles.line, { backgroundColor: Colors[theme].borderColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  line: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dateContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    textAlign: 'center',
  },
});

export default DateSeparator;