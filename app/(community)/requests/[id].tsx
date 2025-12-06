import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Typography from '@/components/ui/Typography/Typography';
import { Colors } from '@/constants/Colors';
import { useCustomTheme } from '@/hooks/useCustomTheme';
import Avatar from '@/components/ui/Avatar';
import Wrapper from '@/components/utilities/Wrapper';
import AppButton from '@/components/ui/AppButton';
import { useCommunityRequests, useUpdateRequestStatus } from '@/hooks/community/useCommunityRequests';
import { useGetCommunity } from '@/hooks/community/useGetCommunity';

interface JoinRequest {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
}

const CommunityRequestsScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id } = params;
  const { theme } = useCustomTheme();
  
  const { data: communityResponse } = useGetCommunity(id as string);
  const { data: requestsResponse, isLoading: isLoadingRequests } = useCommunityRequests(id as string);
  const updateRequestMutation = useUpdateRequestStatus();
  
  const communityData = communityResponse?.data;
  const requests: JoinRequest[] = requestsResponse?.data?.approvals || [];
  const pendingRequests = requests; // All requests in approvals are pending
  
  const handleBack = () => {
    router.back();
  };
  
  const handleApproveRequest = async (userId: string) => {
    try {
      await updateRequestMutation.mutateAsync({
        communityId: id as string,
        memberId: userId,
        status: 'approve'
      });
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };
  
  const handleDenyRequest = async (userId: string) => {
    try {
      await updateRequestMutation.mutateAsync({
        communityId: id as string,
        memberId: userId,
        status: 'deny'
      });
    } catch (error) {
      console.error('Failed to deny request:', error);
    }
  };
  
  const renderRequestItem = ({ item }: { item: JoinRequest }) => {
    const displayName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 
      item.username || 'Unknown User';
    
    const isProcessing = updateRequestMutation.isPending;
    
    return (
      <View style={styles.requestItem}>
        <Avatar
          imageSource={{ uri: item.profilePicture || '' }}
          size={48}
          uri
          showRing={false}
        />
        <View style={styles.requestInfo}>
          <Typography weight="500" textType="textBold">
            {displayName}
          </Typography>
          <Typography size={12} color={Colors[theme].textLight}>
            @{item.username || 'unknown'}
          </Typography>
        </View>
        
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveRequest(item._id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.denyButton]}
            onPress={() => handleDenyRequest(item._id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="close" size={16} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  return (
    <Wrapper>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
      
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors[theme].icon} />
          </TouchableOpacity>
          
          <Typography size={18} weight="600" textType="textBold">
            Join Requests
          </Typography>
          
          <View style={{ width: 24 }} />
        </View>
        
        {/* Community Info */}
        {communityData && (
          <View style={styles.communityInfo}>
            <Typography size={16} weight="500" color={Colors[theme].textBold}>
              {communityData.name}
            </Typography>
            <Typography size={12} color={Colors[theme].textLight}>
              {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
            </Typography>
          </View>
        )}
        
        {/* Requests List */}
        <View style={styles.content}>
          {isLoadingRequests ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.general.primary} />
              <Typography color={Colors[theme].textLight} style={{ marginTop: 16 }}>
                Loading requests...
              </Typography>
            </View>
          ) : (
            <FlatList
              data={pendingRequests}
              renderItem={renderRequestItem}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people-outline" size={48} color={Colors[theme].textLight} />
                  <Typography color={Colors[theme].textLight} align="center" style={{ marginTop: 16 }}>
                    No pending requests
                  </Typography>
                  <Typography color={Colors[theme].textLight} align="center" size={12} style={{ marginTop: 8 }}>
                    Join requests will appear here
                  </Typography>
                </View>
              )}
            />
          )}
        </View>
      </SafeAreaView>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderColor + '20',
  },
  backButton: {
    // padding: 4,
  },
  communityInfo: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderColor + '20',
  },
  content: {
    flex: 1,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderColor + '20',
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: Colors.general.primary,
  },
  denyButton: {
    backgroundColor: '#FF4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
});

export default CommunityRequestsScreen;