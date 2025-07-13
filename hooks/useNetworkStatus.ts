import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      // The `isConnected` property can be null on the first run on some platforms.
      // We only update our state if it's a definite boolean value.
      if (state.isConnected !== null) {
        setIsOnline(state.isConnected);
      }
    });

    // Unsubscribe when the component unmounts to prevent memory leaks
    return () => {
      unsubscribe();
    };
  }, []);

  return { isOnline };
}
