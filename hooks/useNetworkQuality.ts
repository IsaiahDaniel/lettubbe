import { useEffect, useState, useRef, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export type NetworkQuality = 'poor' | 'fair' | 'good' | 'excellent';

interface NetworkQualityInfo {
  quality: NetworkQuality;
  isConnected: boolean;
  isWiFi: boolean;
  connectionType: string | null;
  effectiveConnectionType?: string;
  downlinkSpeed?: number;
  isSlowConnection: boolean;
  bandwidth: number; // Estimated bandwidth in kbps
}

export const useNetworkQuality = (): NetworkQualityInfo => {
  const [networkQuality, setNetworkQuality] = useState<NetworkQualityInfo>({
    quality: 'good',
    isConnected: false,
    isWiFi: false,
    connectionType: null,
    isSlowConnection: false,
    bandwidth: 1000, // Default 1 Mbps
  });

  const measurementsRef = useRef<number[]>([]);
  const testStartTimeRef = useRef<number>(0);

  const estimateBandwidth = useCallback(async () => {
    try {
      // Simple bandwidth estimation using a small test request
      const testUrl = 'https://httpbin.org/bytes/50000'; // 50KB test
      testStartTimeRef.current = Date.now();
      
      const response = await fetch(testUrl, {
        method: 'GET',
      });
      
      if (response.ok) {
        const endTime = Date.now();
        const duration = (endTime - testStartTimeRef.current) / 1000; // seconds
        const bytes = 50000; // 50KB
        const bitsPerSecond = (bytes * 8) / duration;
        const kbps = bitsPerSecond / 1000;
        
        // Keep last 5 measurements for average
        measurementsRef.current.push(kbps);
        if (measurementsRef.current.length > 5) {
          measurementsRef.current.shift();
        }
        
        const avgBandwidth = measurementsRef.current.reduce((a, b) => a + b, 0) / measurementsRef.current.length;
        return Math.max(avgBandwidth, 100); // Minimum 100 kbps
      }
    } catch (error) {
      console.log('Bandwidth test failed, using fallback');
    }
    
    return 500; // Fallback bandwidth
  }, []);

  const determineQuality = useCallback((bandwidth: number, connectionType: string | null, isWiFi: boolean): NetworkQuality => {
    if (!connectionType || connectionType === 'none') return 'poor';
    
    if (isWiFi) {
      if (bandwidth > 5000) return 'excellent'; // > 5 Mbps
      if (bandwidth > 2000) return 'good';      // > 2 Mbps
      if (bandwidth > 500) return 'fair';       // > 500 kbps
      return 'poor';
    } else {
      // Mobile data - generally more conservative
      if (bandwidth > 3000) return 'excellent'; // > 3 Mbps
      if (bandwidth > 1000) return 'good';      // > 1 Mbps
      if (bandwidth > 300) return 'fair';       // > 300 kbps
      return 'poor';
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      const isWiFi = state.type === 'wifi';
      const connectionType = state.type;
      
      if (!isConnected) {
        setNetworkQuality({
          quality: 'poor',
          isConnected: false,
          isWiFi: false,
          connectionType: null,
          isSlowConnection: true,
          bandwidth: 0,
        });
        return;
      }

      // Get additional network details if available
      const details = state.details as any;
      let estimatedBandwidth = 1000; // Default 1 Mbps

      // Try to get effective connection type from network state
      if (details) {
        // For cellular connections, estimate based on type
        if (connectionType === 'cellular') {
          const cellularType = details.cellularGeneration;
          switch (cellularType) {
            case '2g':
              estimatedBandwidth = 100; // ~100 kbps
              break;
            case '3g':
              estimatedBandwidth = 500; // ~500 kbps
              break;
            case '4g':
              estimatedBandwidth = 2000; // ~2 Mbps
              break;
            case '5g':
              estimatedBandwidth = 10000; // ~10 Mbps
              break;
            default:
              estimatedBandwidth = 1000; // Default
          }
        } else if (isWiFi) {
          // For WiFi, try to measure actual bandwidth
          estimatedBandwidth = await estimateBandwidth();
        }
      }

      const quality = determineQuality(estimatedBandwidth, connectionType, isWiFi);
      const isSlowConnection = quality === 'poor' || quality === 'fair';

      setNetworkQuality({
        quality,
        isConnected,
        isWiFi,
        connectionType,
        effectiveConnectionType: details?.effectiveConnectionType,
        downlinkSpeed: details?.downlink,
        isSlowConnection,
        bandwidth: estimatedBandwidth,
      });
    });

    return unsubscribe;
  }, [determineQuality, estimateBandwidth]);

  return networkQuality;
};