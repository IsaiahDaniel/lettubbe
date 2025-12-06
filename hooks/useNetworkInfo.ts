import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkInfo {
  isConnected: boolean;
  isWiFi: boolean;
  connectionType: string | null;
}

export const useNetworkInfo = (): NetworkInfo => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isConnected: false,
    isWiFi: false,
    connectionType: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkInfo({
        isConnected: state.isConnected ?? false,
        isWiFi: state.type === 'wifi',
        connectionType: state.type,
      });
    });

    return unsubscribe;
  }, []);

  return networkInfo;
};
