import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';

interface HeaderTabsProps {
  activeTab: 'Inbox' | 'Communities';
  onTabPress: (tab: 'Inbox' | 'Communities') => void;
  inboxCount?: number;
}

const HeaderTabs = ({ activeTab, onTabPress, inboxCount }: HeaderTabsProps) => {
  const { theme } = useCustomTheme();

  return (
    <View style={styles.headerTabsContainer}>
      <TouchableOpacity 
        style={styles.headerTab}
        onPress={() => onTabPress('Inbox')}
      >
        <View style={styles.headerTabTextContainer}>
          <Typography 
            size={16} 
            weight="600" 
            textType={activeTab === 'Inbox' ? "textBold" : undefined}
            color={activeTab === 'Inbox' ? Colors[theme].text : Colors[theme].textLight}
          >
            Inbox
          </Typography>
          {activeTab === 'Inbox' && inboxCount !== undefined && inboxCount > 0 && (
            <Typography 
              size={14} 
              color={Colors[theme].textLight} 
              style={styles.headerBadge}
            >
              {inboxCount.toString()}
            </Typography>
          )}
        </View>
        <View 
          style={[
            styles.headerTabIndicator, 
            activeTab === 'Inbox' && styles.activeHeaderTabIndicator
          ]} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.headerTab}
        onPress={() => onTabPress('Communities')}
      >
        <View style={styles.headerTabTextContainer}>
          <Typography 
            size={16} 
            weight="600"
            color={activeTab === 'Communities' ? Colors[theme].text : Colors[theme].textLight}
          >
            Communities
          </Typography>
        </View>
        <View 
          style={[
            styles.headerTabIndicator, 
            activeTab === 'Communities' && styles.activeHeaderTabIndicator
          ]} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  headerTab: {
    marginRight: 24,
    paddingTop: 8,
    paddingBottom: 12,
    width: 170,
    alignItems: 'center'
  },
  headerTabTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTabIndicator: {
    width: "80%",
    height: 2,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  activeHeaderTabIndicator: {
    backgroundColor: Colors.general.primary,    
  },
  headerBadge: {
    marginLeft: 4,
  },
});

export default HeaderTabs;