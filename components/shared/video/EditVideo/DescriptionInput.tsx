import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Colors } from '@/constants';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Typography from '@/components/ui/Typography/Typography';

interface DescriptionInputProps {
  description: string;
  onDescriptionChange: (text: string) => void;
  isPhotoPost: boolean;
  maxLength?: number;
}

export const DescriptionInput: React.FC<DescriptionInputProps> = ({
  description,
  onDescriptionChange,
  isPhotoPost,
  maxLength = 500,
}) => {
  const { theme } = useCustomTheme();

  const inputStyle = {
    backgroundColor: Colors[theme].inputBackground,
    color: Colors[theme].text,
    borderColor: Colors[theme].cardBackground,
  };

  return (
    <View style={styles.container}>
      <Typography
        weight="600"
        size={14}
        textType="textBold"
        style={styles.label}
      >
        Description
      </Typography>
      
      <TextInput
        style={[styles.textArea, inputStyle]}
        value={description}
        onChangeText={onDescriptionChange}
        placeholder={`Describe your ${isPhotoPost ? 'photos' : 'video'}...`}
        placeholderTextColor={Colors[theme].textLight}
        multiline={true}
        numberOfLines={4}
        maxLength={maxLength}
      />
      
      <Typography size={12} textType="text" style={styles.charCount}>
        {description.length}/{maxLength}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
    opacity: 0.6,
  },
});