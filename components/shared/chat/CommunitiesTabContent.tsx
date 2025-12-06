import React from 'react';
import { View, StyleSheet } from 'react-native';
import CommunityScreen from '@/components/shared/chat/CommunityScreen';

interface CommunitiesTabContentProps {
  searchTerm: string;
  searchResults: any[];
  isSearching: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  screenWidth: number;
}

const CommunitiesTabContent: React.FC<CommunitiesTabContentProps> = ({
  searchTerm,
  searchResults,
  isSearching,
  onRefresh,
  refreshing,
  screenWidth,
}) => {
  return (
    <View style={[styles.tabContent, { width: screenWidth }]}>
      <CommunityScreen 
        searchTerm={searchTerm}
        searchResults={searchResults}
        isSearching={isSearching}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
  },
});

export default CommunitiesTabContent;