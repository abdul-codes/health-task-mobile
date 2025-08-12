import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';


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
