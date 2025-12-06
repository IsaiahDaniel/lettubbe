import { io, Socket } from "socket.io-client";
import { rootBaseUrl } from "../../config/axiosInstance";

let socket: Socket | null = null;
let currentToken: string | null = null;
let isConnecting: boolean = false;
let disconnectTimer: NodeJS.Timeout | null = null;
let connectingTimer: NodeJS.Timeout | null = null;

// cleanup function for thorough socket disposal
const cleanupSocket = (socketInstance: Socket): void => {
	if (!socketInstance) return;

	console.log("🧹 Cleaning up socket connection:", socketInstance.id);
	
	// Remove all listeners to prevent memory leaks
	socketInstance.removeAllListeners();
	
	// Force disconnect if still connected
	if (socketInstance.connected) {
		socketInstance.disconnect();
	}
	
	// Additional cleanup for any remaining references
	try {
		socketInstance.close();
	} catch (error) {
		console.warn("⚠️ Error during socket close:", error);
	}
};

export const getSocket = (token: string): Socket | null => {
	if (!token) {
		console.warn("⚠️ No token provided, cannot create socket connection");
		return null;
	}

	// Force reset if socket has been connecting for too long
	if (isConnecting && !socket?.connected) {
		const now = Date.now();
		// If we don't have a record of when we started connecting, assume it's been too long
		console.log("🔄 Forcing reset of stuck connection state");
		isConnecting = false;
		if (connectingTimer) {
			clearTimeout(connectingTimer);
			connectingTimer = null;
		}
		if (socket) {
			cleanupSocket(socket);
			socket = null;
		}
		currentToken = null;
	}

	// If token changed, perform complete cleanup before creating new connection
	if (currentToken !== token && socket) {
		console.log("🔄 Token changed, performing complete socket cleanup");
		
		// Clear any pending disconnect timer
		if (disconnectTimer) {
			clearTimeout(disconnectTimer);
			disconnectTimer = null;
		}
		
		// Cleanup old socket
		cleanupSocket(socket);
		socket = null;
		currentToken = null;
		isConnecting = false;
	}

	// Return existing socket if it's healthy and connected
	if (socket && socket.connected && currentToken === token && !isConnecting) {
		return socket;
	}

	// Prevent multiple simultaneous connection attempts
	if (isConnecting) {
		console.log("⏳ Socket connection already in progress, waiting...");
		console.log("🔍 Debug: current socket state:", { 
			socketExists: !!socket, 
			socketConnected: socket?.connected, 
			isConnecting,
			currentToken: currentToken?.substring(0, 20) + "...",
			newToken: token.substring(0, 20) + "..."
		});
		return socket; // Return current socket (may be null or connecting)
	}

	// Create new socket connection
	if (!socket || socket.disconnected) {
		console.log("🔌 Creating new socket connection");
		isConnecting = true;
		currentToken = token;
		
		// Set a timeout to reset connecting state if socket doesn't connect within 30 seconds
		if (connectingTimer) {
			clearTimeout(connectingTimer);
		}
		connectingTimer = setTimeout(() => {
			console.log("🕐 Socket connection timeout - resetting connecting state");
			isConnecting = false;
			if (connectingTimer) {
				clearTimeout(connectingTimer);
				connectingTimer = null;
			}
		}, 30000);
		
		// Clean up any existing socket before creating new one
		if (socket) {
			cleanupSocket(socket);
		}
		
		const socketUrl = rootBaseUrl.endsWith('/') ? rootBaseUrl.slice(0, -1) : rootBaseUrl;
		console.log("🌐 Connecting to:", socketUrl);
		socket = io(socketUrl, {
			auth: { data: token },
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			timeout: 20000,
			forceNew: true, // Force a new connection
		});
		
		console.log("🔌 Socket created, attempting connection...");

		// connection event handlers
		socket.on("connect", () => {
			console.log("✅ Socket connected successfully:", socket?.id);
			isConnecting = false;
			// Clear the connecting timeout since we successfully connected
			if (connectingTimer) {
				clearTimeout(connectingTimer);
				connectingTimer = null;
			}
		});

		socket.on("disconnect", (reason) => {
			console.log("❌ Socket disconnected:", reason);
			isConnecting = false;
			
			// Clean disconnect - don't immediately try to reconnect
			if (reason === "io client disconnect") {
				socket = null;
				currentToken = null;
			}
		});

		socket.on("connect_error", (error) => {
			console.error("🔴 Socket connection error:", error);
			console.error("🔴 Error details:", {
				message: error?.message,
			});
			isConnecting = false;
			
			// Clear the connecting timeout
			if (connectingTimer) {
				clearTimeout(connectingTimer);
				connectingTimer = null;
			}
			
			// On connection error, cleanup and reset
			if (socket) {
				cleanupSocket(socket);
				socket = null;
				currentToken = null;
			}
		});

		// Handle reconnection events
		socket.on("reconnect", (attemptNumber) => {
			console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
			isConnecting = false;
		});

		socket.on("reconnect_error", (error) => {
			console.error("🔴 Socket reconnection error:", error);
		});

		socket.on("reconnect_failed", () => {
			console.error("💀 Socket reconnection failed completely");
			isConnecting = false;
			
			// Cleanup failed connection
			if (socket) {
				cleanupSocket(socket);
				socket = null;
				currentToken = null;
			}
		});
	}

	return socket;
};

export const disconnectSocket = (): void => {
	console.log("🔌 Manually disconnecting socket");
	
	// Clear any pending disconnect timer
	if (disconnectTimer) {
		clearTimeout(disconnectTimer);
		disconnectTimer = null;
	}
	
	// Reset connection state
	isConnecting = false;
	
	if (socket) {
		cleanupSocket(socket);
		socket = null;
		currentToken = null;
	}
};

// Graceful disconnect with delay - useful for app backgrounding
export const gracefulDisconnect = (delay: number = 5000): void => {
	console.log(`⏰ Scheduling graceful disconnect in ${delay}ms`);
	
	// Clear any existing timer
	if (disconnectTimer) {
		clearTimeout(disconnectTimer);
	}
	
	disconnectTimer = setTimeout(() => {
		disconnectSocket();
		disconnectTimer = null;
	}, delay);
};

// Cancel graceful disconnect - useful when app comes back to foreground
export const cancelGracefulDisconnect = (): void => {
	if (disconnectTimer) {
		console.log("❌ Cancelling scheduled disconnect");
		clearTimeout(disconnectTimer);
		disconnectTimer = null;
	}
};

export const isSocketConnected = (): boolean => {
	return socket?.connected ?? false;
};

export const getSocketId = (): string | null => {
	return socket?.id ?? null;
};

// Force reconnect with current token
export const forceReconnect = (): Socket | null => {
	if (!currentToken) {
		console.warn("⚠️ No current token available for reconnect");
		return null;
	}
	
	console.log("🔄 Forcing socket reconnection");
	
	// Disconnect current socket
	if (socket) {
		cleanupSocket(socket);
		socket = null;
	}
	
	// Reset state and create new connection
	isConnecting = false;
	return getSocket(currentToken);
};
