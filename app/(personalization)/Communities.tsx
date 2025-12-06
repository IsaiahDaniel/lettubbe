import { ActivityIndicator, StyleSheet, ScrollView, View, TouchableOpacity, FlatList, Image } from "react-native";
import React, { useMemo, useState, useEffect } from "react";
import { Ionicons } from '@expo/vector-icons';
import Typography from "@/components/ui/Typography/Typography";
import AppButton from "@/components/ui/AppButton";
import Wrapper from "@/components/utilities/Wrapper";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import { Colors, Images } from "@/constants";
import Avatar from "@/components/ui/Avatar";
import CommunityCard from "@/components/shared/personalization/CommunityCard";
import { router } from "expo-router";
import ScrollBottomSpace from "@/components/utilities/ScrollBottomSpace";
import useCommunities from "@/hooks/personalization/useCommunities";
import { useGetAllCommunities } from '@/hooks/community/useGetAllCommunities';
import { useGetJoinedCommunities } from '@/hooks/community/useGetJoinedCommunities';
import { useJoinCommunity } from '@/hooks/community/useJoinCommunity';
import { useSendJoinRequest } from '@/hooks/community/useSendJoinRequest';
import { Community } from '@/helpers/types/chat/chat.types';
import { getCommunityTypeIcon } from '@/helpers/utils/util';
import { useCommunityStore } from '@/store/communityStore';
import useAuth from '@/hooks/auth/useAuth';
import CustomAlert from '@/components/ui/CustomAlert';
import EmptyState from '@/components/shared/chat/EmptyState';

const Communities = () => {
	const { theme } = useCustomTheme();
	const [processingCommunityId, setProcessingCommunityId] = useState<string | null>(null);
	const { userDetails } = useAuth();
	
	// Use global community store for pending state
	const { addPendingCommunity, removePendingCommunity, isPendingCommunity, syncWithJoinedCommunities } = useCommunityStore();

	const { isPending, selectContactHandler, loading, phoneContacts, selectedContacts, appContacts, alertConfig, isAlertVisible, hideAlert } = useCommunities();
	
	// Fetch communities data
	const { data: allCommunitiesData, isLoading: loadingAllCommunities } = useGetAllCommunities();
	const { data: joinedCommunitiesData } = useGetJoinedCommunities();
	const { join, isLoading: isJoining } = useJoinCommunity();
	const sendJoinRequestMutation = useSendJoinRequest();
	
	// Flatten all pages of joined communities data
	const allJoinedCommunitiesData = useMemo(() => 
		joinedCommunitiesData?.pages?.flatMap((page: any) => page?.data?.data || []) || [],
		[joinedCommunitiesData?.pages]
	);

	// Get joined community IDs for filtering
	const joinedCommunityIds = useMemo(() => 
		allJoinedCommunitiesData.map((c: any) => c._id),
		[allJoinedCommunitiesData]
	);
	
	// Sync pending state with joined communities when data loads
	useEffect(() => {
		if (allJoinedCommunitiesData.length > 0) {
			const joinedIds = allJoinedCommunitiesData.map((c: any) => c._id);
			syncWithJoinedCommunities(joinedIds);
		}
	}, [allJoinedCommunitiesData, syncWithJoinedCommunities]);
	
	// Check if user has joined any communities
	const hasJoinedCommunities = useMemo(() => {
		return joinedCommunityIds.length > 0;
	}, [joinedCommunityIds]);
	
	// Transform all communities and filter out joined ones
	const allCommunities: Community[] = (allCommunitiesData?.data?.data || [])
		.map((apiCommunity: any) => {
			const isManuallyPending = isPendingCommunity(apiCommunity._id);
			const isOwner = userDetails?._id === apiCommunity.owner;
			const isAdmin = apiCommunity.admins?.includes(userDetails?._id);
			const isMember = apiCommunity.members?.includes(userDetails?._id);
			const isJoinedOrOwned = joinedCommunityIds.includes(apiCommunity._id) || isOwner || isAdmin || isMember;
			
			return {
				id: apiCommunity._id,
				name: apiCommunity.name,
				avatar: apiCommunity.photoUrl || '',
				memberCount: apiCommunity.members?.length || 0,
				isJoined: isJoinedOrOwned,
				description: apiCommunity.description,
				type: apiCommunity.type || 'public',
				lastMessage: null,
				lastMessageTime: null,
				hasPendingRequest: isManuallyPending // Only use manual pending for consistency
			};
		})
		.filter((community: Community) => !community.isJoined); // Filter out joined communities

	const handleJoinPress = async (communityId: string, isJoined: boolean, communityType?: string) => {
		if (!isJoined) {
			setProcessingCommunityId(communityId);
			try {
				if (communityType === 'private') {
					// Set manual pending state immediately for private communities
					addPendingCommunity(communityId);
					await sendJoinRequestMutation.mutateAsync(communityId);
					console.log(`Successfully sent join request for community ${communityId}`);
				} else {
					// Default to public if type is undefined
					await join(communityId);
					console.log(`Successfully joined community ${communityId}`);
				}
			} catch (error) {
				console.error(`Failed to join/request community ${communityId}:`, error);
				// Remove from pending if request failed
				if (communityType === 'private') {
					removePendingCommunity(communityId);
				}
			} finally {
				setProcessingCommunityId(null);
			}
		}
	};

	return (
		<Wrapper>
			<View style={styles.header}>
				<TouchableOpacity style={styles.skipButton} onPress={() => router.push("/(tabs)")}>
					<Typography style={[styles.skipButtonText, {
						color: hasJoinedCommunities ? Colors.general.primary : Colors[theme].textLight
					}]}>
						{hasJoinedCommunities ? 'Next' : 'Skip'}
					</Typography>
				</TouchableOpacity>
			</View>
			<ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
				<View style={styles.titleContainer}>
					<Typography textType="textBold" weight="600" size={18} lineHeight={33}>
						Find creators & communities that match your vibe
					</Typography>
					{/* <Typography style={{ marginTop: 16 }}>Subscribe to some now or skip</Typography> */}
				</View>

				{loading || isPending ? (
					<ActivityIndicator animating={loading} size="large" color={Colors.general.primary} style={{ marginTop: 12 }} />
				) : (
					<FlatList
						data={appContacts.filter(contact => contact?.name)}
						keyExtractor={(item, index) => index.toString()}
						numColumns={4}
						renderItem={({ item }) => (
							<CommunityCard
								name={item.name}
								imageSource={Images.avatar}
								isSelected={selectedContacts.includes(item.name || "")}
								onPress={() => selectContactHandler(item.name || "")}
								theme={theme}
							/>
						)}
						columnWrapperStyle={{
							marginTop: 16,
						}}
						ListEmptyComponent={() => (
							<View style={{ alignItems: "center", marginTop: 20 }}>
								<Typography>No contacts available</Typography>
							</View>
						)}
						scrollEnabled={false}
					/>
				)}

				<View style={styles.recommendedSection}>
					<Typography weight="600" size={14} lineHeight={22}>
						Recommended communities
					</Typography>
					<View style={{ marginTop: 16 }}>
						{loadingAllCommunities ? (
							<ActivityIndicator animating={true} size="large" color={Colors.general.primary} style={{ marginTop: 12 }} />
						) : allCommunities.length > 0 ? (
							allCommunities.map((community) => (
								<View key={community.id} style={[styles.communityItem, { borderColor: Colors[theme].borderColor }]}>
									<View style={styles.communityInfo}>
										<View style={styles.avatarContainer}>
											{community.avatar ? (
												<Image 
													source={{ uri: community.avatar }}
													style={styles.avatarImage}
												/>
											) : (
												<View style={[styles.avatarImage, styles.avatarPlaceholder]}>
													<Typography size={16} weight="600" color={Colors[theme].textLight}>
														{community.name.charAt(0).toUpperCase()}
													</Typography>
												</View>
											)}
										</View>
										<View style={styles.communityDetails}>
											<View style={styles.nameContainer}>
												<Typography weight="600" size={16} lineHeight={17} textType="textBold" numberOfLines={1} style={styles.communityName}>
													{community.name}
												</Typography>
												<Ionicons 
													name={getCommunityTypeIcon(community.type || 'public') as any} 
													size={12} 
													color={Colors[theme].textLight} 
													style={styles.typeIcon}
												/>
											</View>
											<View style={styles.memberCount}>
												<Ionicons name="people-outline" size={14} color={Colors[theme].textLight} />
												<Typography size={12} color={Colors[theme].textLight} style={styles.memberCountText}>
													{community.memberCount} member{community.memberCount !== 1 ? 's' : ''}
												</Typography>
											</View>
										</View>
									</View>
									
									{!community.isJoined && !community.hasPendingRequest && (
										<AppButton 
											variant="compact" 
											title={processingCommunityId === community.id 
												? (community.type === 'private' ? 'Sending Request...' : 'Joining...') 
												: (community.type === 'private' ? 'Send Request' : 'Join')} 
											handlePress={() => handleJoinPress(community.id, community.isJoined, community.type)} 
											disabled={processingCommunityId === community.id}
										/>
									)}
									{community.hasPendingRequest && (
										<View style={[styles.pendingIndicator, { backgroundColor: '#F0F0F0' }]}>
											<Typography size={12} color={Colors[theme].textLight}>
												Pending
											</Typography>
										</View>
									)}
									{community.isJoined && (
										<View style={[styles.joinedIndicator, { backgroundColor: Colors[theme].cardBackground }]}>
											<Typography size={12} color={Colors[theme].textLight}>
												Joined
											</Typography>
										</View>
									)}
								</View>
							))
						) : (
							<EmptyState 
								title="No Communities Available"
								subtitle="Check back later for new communities to join"
								image={require('@/assets/images/Empty.png')}
							/>
						)}
					</View>
				</View>
				<ScrollBottomSpace />
			</ScrollView>
			
			{/* Custom Alert */}
			{alertConfig && (
				<CustomAlert
					visible={isAlertVisible}
					title={alertConfig.title}
					message={alertConfig.message}
					primaryButton={alertConfig.primaryButton}
					secondaryButton={alertConfig.secondaryButton}
					onClose={hideAlert}
					variant={alertConfig.variant}
				/>
			)}
		</Wrapper>
	);
};

export default Communities;

const styles = StyleSheet.create({
	header: {
		height: 60,
		justifyContent: 'center',
		alignItems: 'flex-end',
		paddingHorizontal: 0,
		marginTop: 10,
	},
	skipButton: {
		paddingVertical: 8,
	},
	scrollContainer: {
		flex: 1,
	},
	skipButtonText: {
		fontSize: 14,
		fontWeight: "400",
	},
	communityItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	communityInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		paddingRight: 12,
	},
	avatarContainer: {
		width: 50,
		height: 50,
		borderRadius: 25,
		overflow: 'hidden',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	avatarImage: {
		width: '100%',
		height: '100%',
	},
	avatarPlaceholder: {
		backgroundColor: '#E5E5E5',
		justifyContent: 'center',
		alignItems: 'center',
	},
	communityDetails: {
		flex: 1,
	},
	nameContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	communityName: {
		flex: 1,
	},
	typeIcon: {
		marginLeft: 4,
	},
	memberCount: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 4,
	},
	memberCountText: {
		marginLeft: 4,
	},
	joinedIndicator: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	pendingIndicator: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	titleContainer: {
		marginBottom: 20,
	},
	recommendedSection: {
		marginTop: 15,
	},
});
