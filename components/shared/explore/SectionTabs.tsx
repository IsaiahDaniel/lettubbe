import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { Colors } from '@/constants';
import { SectionType } from '@/hooks/explore/useExploreSections';

interface SectionTabsProps {
  currentSection: SectionType;
  onSectionChange: (section: SectionType) => void;
}

const SectionTabs: React.FC<SectionTabsProps> = ({
  currentSection,
  onSectionChange
}) => {
  const { theme } = useCustomTheme();
  
  const sections: { key: SectionType; title: string }[] = [
    { key: 'trending', title: 'Trending' },
    { key: 'popular', title: 'Popular' },
    { key: 'forYou', title: 'For You' }
  ];
  
  return (
    <View style={styles.container}>
      {sections.map((section) => (
        <TouchableOpacity
          key={section.key}
          style={[
            styles.tab,
            currentSection === section.key && styles.activeTab,
            currentSection === section.key && { borderBottomColor: Colors.general.primary }
          ]}
          onPress={() => onSectionChange(section.key)}
        >
          <Typography
            textType='textBold'
            size={16}
            color={currentSection === section.key ? Colors.general.primary : Colors[theme].textLight}
          >
            {section.title}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  }
});

export default SectionTabs;