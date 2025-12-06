import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';

interface EmptySearchProps {
  searchTerm: string;
  message?: string;
}

const EmptySearch: React.FC<EmptySearchProps> = ({
  searchTerm,
  message = "No results found"
}) => {
  const { theme } = useCustomTheme();
  
  return (
    <View style={styles.container}>
      <Ionicons 
        name="search-outline" 
        size={60} 
        color={Colors[theme].textLight} 
      />
      
      <Typography 
        textType="textBold" 
        size={18} 
        style={styles.title}
      >
        No results for "{searchTerm}"
      </Typography>
      
      <Typography 
        color={Colors[theme].textLight}
        size={16}
        style={styles.message}
      >
        {message}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    marginTop: 16,
  },
  message: {
    marginTop: 8,
    maxWidth: 300,
    textAlign: 'center'
  }
});

export default EmptySearch;