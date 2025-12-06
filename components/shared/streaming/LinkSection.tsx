import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import Typography from '@/components/ui/Typography/Typography';

interface LinkSectionProps {
  shareLink: string;
  onCopy: () => void;
}

const LinkSection: React.FC<LinkSectionProps> = ({ shareLink, onCopy }) => {
  const { theme } = useCustomTheme();

  return (
    <View style={styles.container}>
      <Typography weight="600" size={14} textType="textBold" style={styles.title}>
        Or share with link
      </Typography>
      <View style={[styles.linkContainer, {
        backgroundColor: Colors[theme].inputBackground,
        borderColor: Colors[theme].borderColor,
      }]}>
        <Typography 
          size={12} 
          color={Colors[theme].textLight} 
          style={styles.linkText}
          numberOfLines={1}
        >
          {shareLink}
        </Typography>
        <TouchableOpacity onPress={onCopy} style={styles.copyButton}>
          <Ionicons name="copy-outline" size={20} color={Colors[theme].textBold} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    marginBottom: 12,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    justifyContent: 'space-between',
  },
  linkText: {
    flex: 1,
    marginRight: 12,
  },
  copyButton: {
    padding: 4,
  },
});

export default LinkSection;