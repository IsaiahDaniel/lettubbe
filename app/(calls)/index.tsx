import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useCallStore from '@/store/callsStore';
import useContactStore from '@/store/contactStore';
import CallListItem from '@/components/shared/calls/CallListItem';
import { CallHistoryItem, CallSection } from '@/helpers/types/chat/call';
import BackButton from '@/components/utilities/BackButton';
import { Colors } from '@/constants/Colors';
import Typography from '@/components/ui/Typography/Typography';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import { ThemedView } from '@/components/ThemedView';

export default function CallsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { callHistory, clearCallHistory, toggleFavorite } = useCallStore();
  const { fetchContacts, contacts, isLoading } = useContactStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { theme } = useCustomTheme();
  
  // First filter calls based on active tab
  const filteredCalls = useMemo(() => {
    if (activeTab === 'missed') {
      return callHistory.filter(call => call.missed);
    } else if (activeTab === 'audio') {
      return callHistory.filter(call => call.type === 'audio');
    } else if (activeTab === 'video') {
      return callHistory.filter(call => call.type === 'video');
    }
    return callHistory;
  }, [callHistory, activeTab]);
  
  // Get favorite calls
  const favoriteCalls = useMemo(() => {
    return callHistory.filter(call => call.favorite);
  }, [callHistory]);
  
  // Then group filtered calls by date for section list
  const groupedCalls = useMemo(() => {
    const groups: {[key: string]: CallHistoryItem[]} = {};
    
    filteredCalls.forEach(call => {
      const date = new Date(call.timestamp);
      const dateString = date.toDateString();
      
      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      
      groups[dateString].push(call);
    });
    
    // First add favorites section if there are any favorites
    const sections = [];
    
    if (favoriteCalls.length > 0) {
      sections.push({
        title: 'Favorites',
        data: favoriteCalls,
        isFavoritesSection: true
      });
    }
    
    // Then add a recent section with the most recent calls
    const recentCalls = filteredCalls.slice(0, 5);
    if (recentCalls.length > 0) {
      sections.push({
        title: 'Recent',
        data: recentCalls,
        isRecentSection: true
      });
    }
    
    // Add the remaining date-grouped calls
    sections.push(
      ...Object.entries(groups).map(([date, calls]) => ({
        title: formatSectionDate(date),
        data: calls,
      }))
    );
    
    return sections;
  }, [filteredCalls, favoriteCalls]);
  
  // Format date for section headers
  function formatSectionDate(dateString: string) {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    if (dateString === today) {
      return 'Today';
    } else if (dateString === yesterdayString) {
      return 'Yesterday';
    } else {
      return new Date(dateString).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }
  }
  
  // Load contacts if needed
  useEffect(() => {
    if (contacts.length === 0 && !isLoading) {
      fetchContacts();
    }
  }, [contacts.length, fetchContacts, isLoading]);

  const handleNewCall = () => {
    router.push('/(calls)/select-contact');
  };
  
  const handleClearHistory = () => {
    if (showClearConfirm) {
      clearCallHistory();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
    }
  };

  const handleAddToFavorites = () => {
    router.push('/(calls)/add-favorites');
  };
  
  // Render header for each section with appropriate styling
  const renderSectionHeader = ({ section }: { section: CallSection }) => {
    const isSpecialSection = section.isFavoritesSection || section.isRecentSection;
    
    return (
      <View style={[
        styles.sectionHeader, 
        isSpecialSection && styles.specialSectionHeader,
        { backgroundColor: Colors[theme].cardBackground }
      ]}>
        <Typography 
          textType="secondary" 
          weight="500" 
          size={16}
        >
          {section.title}
        </Typography>
        
        {section.isFavoritesSection && (
          <TouchableOpacity onPress={handleAddToFavorites}>
            <Typography 
              color={Colors.general.primary} 
              weight="500" 
              size={16}
            >
              Add
            </Typography>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.general.primary} />
        <Typography style={styles.loadingText} textType="secondary" size={16}>
          Loading calls...
        </Typography>
      </View>
    );
  }
  
  // Render the add favorites placeholder when no favorites exist
  const renderAddFavoritesPlaceholder = () => {
    if (favoriteCalls.length === 0) {
      return (
        <View style={styles.addFavoritesContainer}>
          <TouchableOpacity 
            style={styles.addFavoritesButton}
            onPress={handleAddToFavorites}
          >
            <TouchableOpacity
                style={[styles.favoritesButton, {borderColor: Colors[theme].cardBackground} ]}
                onPress={handleAddToFavorites}>
                <MaterialIcons name="favorite-outline" size={24} color={Colors.general.primary} />
            </TouchableOpacity>
            <Typography size={16}>Add Favorites</Typography>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };
  
  return (
    <ThemedView style={{flex: 1}}>

      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <BackButton />
          
          {/* <View style={styles.headerActions}>
            {callHistory.length === 0 ? (
              // Show "Add Mock Data" button when history is empty
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={populateMockCallHistory}
              >
                <Typography 
                  color={Colors.general.primary} 
                  weight="500" 
                  size={16}
                >
                  Add Mock Data
                </Typography>
              </TouchableOpacity>
            ) : (
              // Show Clear button when there is history
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={handleClearHistory}
              >
                <Typography 
                  color={showClearConfirm ? Colors.general.error : Colors.general.primary} 
                  weight="500" 
                  size={16}
                >
                  {showClearConfirm ? 'Confirm Clear' : 'Clear'}
                </Typography>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.menuButton}>
              <MaterialIcons 
                name="more-vert" 
                size={24} 
                color={Colors[theme].text} 
              />
            </TouchableOpacity>
          </View> */}
        </View>
        <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton]} 
          onPress={() => setActiveTab('all')}
        >
          <View style={[
            styles.tabPill, 
            { backgroundColor: activeTab === 'all' ? Colors.general.primary : Colors[theme].cardBackground }
          ]}>
            <Typography 
              color={activeTab === 'all' ? '#FFFFFF' : Colors[theme].secondary} 
              weight={activeTab === 'all' ? '500' : '400'} 
              size={14}
            >
              All
            </Typography>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton]} 
          onPress={() => setActiveTab('missed')}
        >
          <View style={[
            styles.tabPill, 
            { backgroundColor: activeTab === 'missed' ? Colors.general.primary : Colors[theme].cardBackground }
          ]}>
            <Typography 
              color={activeTab === 'missed' ? '#FFFFFF' : Colors[theme].secondary} 
              weight={activeTab === 'missed' ? '500' : '400'} 
              size={14}
            >
              Missed
            </Typography>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton]} 
          onPress={() => setActiveTab('audio')}
        >
          <View style={[
            styles.tabPill, 
            { backgroundColor: activeTab === 'audio' ? Colors.general.primary : Colors[theme].cardBackground }
          ]}>
            <Typography 
              color={activeTab === 'audio' ? '#FFFFFF' : Colors[theme].secondary} 
              weight={activeTab === 'audio' ? '500' : '400'} 
              size={14}
            >
              Audio
            </Typography>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton]} 
          onPress={() => setActiveTab('video')}
        >
          <View style={[
            styles.tabPill, 
            { backgroundColor: activeTab === 'video' ? Colors.general.primary : Colors[theme].cardBackground }
          ]}>
            <Typography 
              color={activeTab === 'video' ? '#FFFFFF' : Colors[theme].secondary} 
              weight={activeTab === 'video' ? '500' : '400'} 
              size={14}
            >
              Video
            </Typography>
          </View>
        </TouchableOpacity>
        </View>
        
        {filteredCalls.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="call" size={70} color="#E0E0E0" />
            <Typography 
              weight="bold" 
              size={20} 
              textType="secondary" 
              style={styles.emptyTitle}
            >
              {callHistory.length === 0 ? "No Call History" : "No Matching Calls"}
            </Typography>
            <Typography 
              textType="secondary" 
              size={16} 
              align="center" 
              style={styles.emptySubtitle}
            >
              {callHistory.length === 0 
                ? "Start making calls to see your history here" 
                : `No ${activeTab === 'all' ? '' : activeTab} calls in your history`}
            </Typography>
            
            <TouchableOpacity 
              style={styles.newCallEmptyButton}
              onPress={handleNewCall}
            >
              <Typography 
                color="#FFFFFF" 
                weight="bold" 
                size={16}
              >
                New Call
              </Typography>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderAddFavoritesPlaceholder()}
            <SectionList
              sections={groupedCalls}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <CallListItem callItem={item} />}
              renderSectionHeader={renderSectionHeader}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              stickySectionHeadersEnabled={true}
            />
          </>
        )}
        
        {/* Quick action buttons at bottom */}
        <View style={[styles.quickActions, { paddingBottom: insets.bottom || 16 }]}>
          <TouchableOpacity 
            style={styles.fabButton}
            onPress={handleNewCall}
          >
            <MaterialIcons name="call" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabButton: {
    marginRight: 8,
  },
  tabPill: {
    paddingHorizontal: 12,
    justifyContent: "center",
    height: 27,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  newCallButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  specialSectionHeader: {
    borderBottomWidth: 0,
    paddingVertical: 4,
  },
  quickActions: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.general.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 16,
  },
  emptySubtitle: {
    marginTop: 8,
    marginBottom: 24,
  },
  newCallEmptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.general.primary,
    borderRadius: 24,
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  addFavoritesContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  addFavoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16
  },
  favoritesButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    borderWidth: 2.5,
    padding: 9
  },
});