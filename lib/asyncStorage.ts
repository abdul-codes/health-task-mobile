import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

/**
 * An adapter for TanStack Query's persister.
 * It uses a simple promise-based interface that matches the persister's requirements.
 */
export const asyncStoragePersister = {
  getItem: (name: string): Promise<string | null> => {
    return AsyncStorage.getItem(name);
  },
  setItem: (name: string, value: string): Promise<void> => {
    return AsyncStorage.setItem(name, value);
  },
  removeItem: (name: string): Promise<void> => {
    return AsyncStorage.removeItem(name);
  },
};

/**
 * An adapter specifically for Zustand's persist middleware.
 * It explicitly uses async/await and is typed with `StateStorage` for full compatibility.
 */
export const zustandStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(name);
    } catch (e) {
      console.error('Failed to fetch item from AsyncStorage', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      console.error('Failed to save item to AsyncStorage', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (e) {
      console.error('Failed to remove item from AsyncStorage', e);
    }
  },
};
