import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm } from 'react-hook-form';
import Input from '@/components/ui/inputs/Input';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Typography from '@/components/ui/Typography/Typography';

interface SearchBarProps {
  placeholder?: string;
  rightComponent?: 'call' | 'explore';
  onRightComponentPress?: () => void;
  onSearchChange?: (text: string) => void;
  searchValue?: string;
  showCancelButton?: boolean;
  onCancel?: () => void;
}

const SearchBar = ({ 
  placeholder = "Search messages", 
  rightComponent = 'call',
  onRightComponentPress = () => {},
  onSearchChange,
  searchValue,
  showCancelButton = false,
  onCancel
}: SearchBarProps) => {
  const { theme } = useCustomTheme();
  const { control, watch, setValue } = useForm({
    defaultValues: {
      search: searchValue || ''
    }
  });

  // Sync form value with prop when searchValue changes externally
  React.useEffect(() => {
    setValue('search', searchValue || '');
  }, [searchValue, setValue]);

  React.useEffect(() => {
    const subscription = watch((value) => {
      if (onSearchChange && value.search !== undefined) {
        onSearchChange(value.search);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onSearchChange]);

  const renderRightComponent = () => {
    if (showCancelButton && searchValue && searchValue.length > 0) {
      return (
        <TouchableOpacity 
          style={[styles.rightButton, styles.cancelButton]} 
          onPress={onCancel}
        >
          <Typography 
            size={14} 
            color={Colors.general.primary}
            weight="500"
          >
            Cancel
          </Typography>
        </TouchableOpacity>
      );
    }

    switch (rightComponent) {
      case 'call':
        return (
          <TouchableOpacity style={styles.rightButton} onPress={onRightComponentPress}>
            {/* <Ionicons name="call-outline" size={22} color={Colors.general.primary} /> */}
          </TouchableOpacity>
        );
      case 'explore':
        return (
          <TouchableOpacity 
            style={[styles.rightButton, styles.exploreButton]} 
            onPress={onRightComponentPress}
          >
            <Typography 
              size={14} 
              color={Colors.general.primary}
              weight="500"
            >
              Explore
            </Typography>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={Colors.general.primary} 
              style={styles.chevronIcon}
            />
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.searchRow}>
      <View style={styles.inputContainer}>
        <Input 
          name="search"
          control={control}
          placeholder={placeholder}
        />
      </View>
      {renderRightComponent()}
    </View>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  inputContainer: {
    flex: 1,
  },
  rightButton: {
    marginLeft: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronIcon: {
    marginLeft: 2,
  },
  cancelButton: {
    paddingHorizontal: 8,
  }
});

export default SearchBar;