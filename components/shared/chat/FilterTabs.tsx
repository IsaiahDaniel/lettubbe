import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface FilterTabsProps {
  activeTab: 'All' | 'Unread' | 'Favorites' | 'Archived';
  onTabPress: (tab: 'All' | 'Unread' | 'Favorites' | 'Archived') => void;
}

const FilterTabs = ({ activeTab, onTabPress }: FilterTabsProps) => {
  const { theme } = useCustomTheme();
  
  const tabs: ('All' | 'Unread' | 'Favorites' | 'Archived')[] = ['All', 'Unread', 'Favorites', 'Archived'];

  return (
    <View style={styles.tabBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab, 
              { backgroundColor: Colors[theme].cardBackground },
              activeTab === tab && [styles.activeTab, { backgroundColor: Colors.general.primary }]
            ]}
            onPress={() => onTabPress(tab)}
          >
            <Typography 
              color={activeTab === tab ? '#ffffff' : Colors[theme].textLight}
              weight={activeTab === tab ? '500' : '400'}
              size={12}
            >
              {tab}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  tab: {
    justifyContent: 'center',
    height: 27,
    paddingHorizontal: 10,
    marginRight: 10,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: Colors.general.primary,
  },
});

export default FilterTabs;