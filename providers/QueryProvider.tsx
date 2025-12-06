import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { devLog } from "@/config/dev";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// cache config for faster app launch
			staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
			gcTime: 10 * 60 * 1000, // 10 minutes - keep in memory
			refetchOnWindowFocus: false, // Don't refetch on app focus
			refetchOnMount: false, // Don't refetch on component mount if cached
			refetchOnReconnect: true, // Refetch when network reconnects
			retry: 2, // Retry failed requests twice
			retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
		},
		mutations: {
			retry: 1, // Retry mutations once on failure
		},
	},
});

// query client with cache performance logging
queryClient.setQueryDefaults(['userFeeds'], {
	staleTime: 5 * 60 * 1000, // 5 minutes for feed posts
	gcTime: 15 * 60 * 1000, // 15 minutes in memory
});

queryClient.setQueryDefaults(['pinnedPosts'], {
	staleTime: 10 * 60 * 1000, // 10 minutes for pinned posts (change less frequently)
	gcTime: 20 * 60 * 1000, // 20 minutes in memory
});

queryClient.setQueryDefaults(['publicProfile'], {
	staleTime: 15 * 60 * 1000, // 15 minutes for profile data
	gcTime: 30 * 60 * 1000, // 30 minutes in memory
});

queryClient.setQueryDefaults(['getUserConversations'], {
	staleTime: 2 * 60 * 1000, // 2 minutes for chat conversations
	gcTime: 10 * 60 * 1000, // 10 minutes in memory
});

type QueryProviderProps = {
	children: JSX.Element | JSX.Element[];
};

const QueryProvider = ({ children }: QueryProviderProps) => {
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default QueryProvider;