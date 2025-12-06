import { Socket } from "socket.io-client";
import { getSocket, disconnectSocket, isSocketConnected, getSocketId } from "./socket";

/**
 * Centralized socket connection manager with connection health monitoring
 * Prevents multiple connections and provides connection diagnostics
 */
class SocketManager {
  private static instance: SocketManager;
  private connectionAttempts: number = 0;
  private lastConnectionAttempt: number = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<string>> = new Map(); // Track listeners by component

  private constructor() {
    this.startHealthCheck();
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  /**
   * Get socket connection with rate limiting and health checks
   */
  public getConnection(token: string, componentId?: string): Socket | null {
    if (!token) {
      console.warn("⚠️ SocketManager: No token provided");
      return null;
    }

    // Rate limiting: prevent too frequent connection attempts
    const now = Date.now();
    if (now - this.lastConnectionAttempt < 1000) {
      console.warn("⚠️ SocketManager: Connection attempt rate limited");
      return null;
    }

    this.lastConnectionAttempt = now;
    this.connectionAttempts++;

    // Log connection request for debugging
    if (componentId) {
      console.log(`🔌 SocketManager: Connection requested by ${componentId}`);
    }

    const socket = getSocket(token);
    
    if (socket) {
      console.log(`✅ SocketManager: Connection established (${this.connectionAttempts} attempts)`);
      this.connectionAttempts = 0; // Reset on successful connection
    } else {
      console.error(`❌ SocketManager: Connection failed (attempt ${this.connectionAttempts})`);
    }

    return socket;
  }

  /**
   * Register component as using socket connection
   */
  public registerComponent(componentId: string, eventTypes: string[]): void {
    console.log(`📝 SocketManager: Registering component ${componentId} for events:`, eventTypes);
    this.listeners.set(componentId, new Set(eventTypes));
  }

  /**
   * Unregister component from socket connection
   */
  public unregisterComponent(componentId: string): void {
    console.log(`🗑️ SocketManager: Unregistering component ${componentId}`);
    this.listeners.delete(componentId);
    
    // If no components are listening, consider disconnecting after delay
    if (this.listeners.size === 0) {
      console.log("⚠️ SocketManager: No components listening, socket may be disconnected soon");
    }
  }

  /**
   * Get connection statistics for debugging
   */
  public getConnectionStats(): {
    isConnected: boolean;
    socketId: string | null;
    connectionAttempts: number;
    activeListeners: number;
    listenerComponents: string[];
  } {
    return {
      isConnected: isSocketConnected(),
      socketId: getSocketId(),
      connectionAttempts: this.connectionAttempts,
      activeListeners: this.listeners.size,
      listenerComponents: Array.from(this.listeners.keys()),
    };
  }

  /**
   * Force disconnect all connections
   */
  public forceDisconnect(): void {
    console.log("💀 SocketManager: Force disconnecting all connections");
    this.stopHealthCheck();
    disconnectSocket();
    this.listeners.clear();
    this.connectionAttempts = 0;
  }

  /**
   * Start periodic health check
   */
  private startHealthCheck(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(() => {
      const stats = this.getConnectionStats();
      
      // Log health status periodically
      if (stats.activeListeners > 0) {
        console.log(`💗 SocketManager Health: Connected=${stats.isConnected}, Listeners=${stats.activeListeners}, ID=${stats.socketId}`);
        
        // Detect zombie connections (listeners but no connection)
        if (stats.activeListeners > 0 && !stats.isConnected) {
          console.warn("⚠️ SocketManager: Detected potential zombie connection state");
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop health check
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get diagnostics for troubleshooting
   */
  public getDiagnostics(): object {
    const stats = this.getConnectionStats();
    return {
      ...stats,
      lastConnectionAttempt: new Date(this.lastConnectionAttempt).toISOString(),
      healthCheckActive: !!this.healthCheckInterval,
      listenerDetails: Object.fromEntries(this.listeners),
    };
  }
}

// Export singleton instance
export const socketManager = SocketManager.getInstance();
export default socketManager;