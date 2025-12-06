import React, { useMemo, useRef, useCallback } from "react";
import { View, StyleSheet, StatusBar, Animated } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { Colors } from "@/constants/Colors";
import { useCustomTheme } from "@/hooks/useCustomTheme";
import HeaderTabs from "@/components/shared/chat/HeaderTabs";
import ChatSearchBar from "@/components/shared/chat/ChatSearchBar";
import InboxTabContent from "@/components/shared/chat/InboxTabContent";
import CommunitiesTabContent from "@/components/shared/chat/CommunitiesTabContent";
import { useTabNavigation } from "@/hooks/chats/useTabNavigation";
import { useConversationData } from "@/hooks/chats/useConversationData";
import { useSearchLogic } from "@/hooks/chats/useSearchLogic";
import { useChatActions } from "@/hooks/chats/useChatActions";
import { CHAT_CONSTANTS } from "@/constants/chat.constants";
import { ChatDomainService } from "@/services/chat.domain.service";

const InboxScreen = () => {
	const renderCountRef = useRef(0);
	renderCountRef.current += 1;
	// console.log('📱 InboxScreen: Component mounting at', performance.now(), '- Render #', renderCountRef.current);
	// console.log('📱 InboxScreen: Component stack:', new Error().stack?.split('\n')[2]);
	const { theme } = useCustomTheme();
	const queryClient = useQueryClient();

	// Refresh conversations when returning to chat tab
	useFocusEffect(
		useCallback(() => {
			console.log('📱 [CHAT_TAB] Focus effect triggered - refreshing conversations');
			
			// Clear domain service caches to ensure fresh data
			ChatDomainService.clearCaches();
			
			// Invalidate conversation queries
			queryClient.invalidateQueries({ 
				predicate: (query) => {
					const key = query.queryKey;
					return Array.isArray(key) && 
						   key[0] === "getUserConversations" && 
						   (key.length === 1 || key[1] === "infinite");
				}
			});
		}, [queryClient])
	);
	
	const {
		activeTab,
		setActiveTab,
		activeHeaderTab,
		handleHeaderTabPress,
		handleGestureEvent,
		handleSwipe,
		translateX,
		screenWidth,
	} = useTabNavigation();
	
	const {
		messagesSearchTerm,
		setMessagesSearchTerm,
		communitiesSearchTerm,
		setCommunitiesSearchTerm,
		getSearchResults,
		displayCommunities,
		isSearchLoading,
		isSearchingCommunities,
		handleCancelSearch,
	} = useSearchLogic();
	
	// Memoize the key dependencies to prevent infinite re-renders
	const memoizedActiveTab = useMemo(() => activeTab, [activeTab]);
	const memoizedMessagesSearchTerm = useMemo(() => messagesSearchTerm, [messagesSearchTerm]);
	
	const {
		conversations,
		unreadCount,
		isLoading,
		refetch,
		hasNextPage,
		isFetchingNextPage,
		onEndReached,
	} = useConversationData(memoizedActiveTab, memoizedMessagesSearchTerm);
	
	const {
		handleChatPress,
		handleCallPress,
		handleExplorePress,
		handleNewMessagePress,
		handleToggleFavorite,
		handleToggleArchive,
		handleCommunityRefresh,
	} = useChatActions();
	
	// Memoize getSearchResults to prevent re-renders
	const memoizedGetSearchResults = useMemo(() => getSearchResults, [getSearchResults]);
	
	// Memoized display conversations for the current view
	const displayConversations = useMemo(() => {
		// console.log('📱 InboxScreen: Getting display conversations from', conversations?.length || 0, 'conversations');
		const result = memoizedGetSearchResults(conversations);
		// console.log('📱 InboxScreen: Display conversations ready:', result?.length || 0, 'at', performance.now());
		return result;
	}, [memoizedGetSearchResults, conversations]);

	// Memoized loading state for current operations
	const isInitialLoading = useMemo(() => {
		if (messagesSearchTerm) {
			return isSearchLoading;
		}
		return isLoading;
	}, [messagesSearchTerm, isSearchLoading, isLoading]);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: Colors[theme].background }]}>
			<StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

			<ChatSearchBar
				activeHeaderTab={activeHeaderTab}
				messagesSearchTerm={messagesSearchTerm}
				communitiesSearchTerm={communitiesSearchTerm}
				onMessagesSearchChange={setMessagesSearchTerm}
				onCommunitiesSearchChange={setCommunitiesSearchTerm}
				onCallPress={handleCallPress}
				onExplorePress={handleExplorePress}
				onCancel={handleCancelSearch}
			/>

			<HeaderTabs 
				activeTab={activeHeaderTab} 
				onTabPress={handleHeaderTabPress} 
				inboxCount={unreadCount} 
			/>

			<PanGestureHandler 
				onGestureEvent={handleGestureEvent}
				onHandlerStateChange={handleSwipe}
				activeOffsetX={CHAT_CONSTANTS.GESTURES.ACTIVE_OFFSET_X}
				failOffsetY={CHAT_CONSTANTS.GESTURES.FAIL_OFFSET_Y}
				shouldCancelWhenOutside={false}
			>
				<Animated.View 
					style={[
						styles.swipeContainer,
						{
							transform: [{ translateX }],
							width: screenWidth * 2, // Container for both tabs
							flexDirection: 'row',
						}
					]}
				>
					{/* Inbox Tab Content */}
					<InboxTabContent
						activeTab={activeTab}
						onTabPress={setActiveTab}
						displayConversations={displayConversations}
						onChatPress={handleChatPress}
						onToggleFavorite={handleToggleFavorite}
						onToggleArchive={handleToggleArchive}
						onRefresh={refetch}
						refreshing={isInitialLoading}
						onEndReached={onEndReached}
						hasNextPage={hasNextPage}
						isFetchingNextPage={isFetchingNextPage}
						isInitialLoading={isInitialLoading}
						onNewMessagePress={handleNewMessagePress}
						screenWidth={screenWidth}
					/>

					{/* Communities Tab Content */}
					<CommunitiesTabContent
						searchTerm={communitiesSearchTerm}
						searchResults={displayCommunities}
						isSearching={isSearchingCommunities}
						onRefresh={handleCommunityRefresh}
						refreshing={false}
						screenWidth={screenWidth}
					/>
				</Animated.View>
			</PanGestureHandler>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	swipeContainer: {
		flex: 1,
	},
});

export default InboxScreen;