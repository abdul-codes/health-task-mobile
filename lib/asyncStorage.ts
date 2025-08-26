import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

const storage = new MMKV();

export const asyncStoragePersister = {
  getItem: (name: string): Promise<string | null> => {
    const value = storage.getString(name);
    return Promise.resolve(value ?? null);
  },
  setItem: (name: string, value: string): Promise<void> => {
    storage.set(name, value);
    return Promise.resolve();
  },
  removeItem: (name: string): Promise<void> => {
    storage.delete(name);
    return Promise.resolve();
  },
};


export const zustandStorage: StateStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
};