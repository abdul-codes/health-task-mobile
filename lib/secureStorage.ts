import * as SecureStore from "expo-secure-store";
import { MMKV } from "react-native-mmkv";

// Sync storage adapter for the auth store, backed by the device keychain / keystore.
// expo-secure-store's sync getItem/setItem keep Zustand hydration synchronous, so the
// app still knows on first render whether the user is logged in.
// The auth blob (user + two tokens) is well under SecureStore's ~2 KB iOS guidance.

const legacyStorage = new MMKV();

export const secureAuthStorage = {
  getItem: (name: string): string | null => {
    const value = SecureStore.getItem(name);
    if (value !== null) return value;

    // One-time migration: older builds kept the auth blob (tokens included) in plain MMKV
    const legacy = legacyStorage.getString(name);
    if (legacy === undefined) return null;
    SecureStore.setItem(name, legacy);
    legacyStorage.delete(name);
    return legacy;
  },
  setItem: (name: string, value: string): void => {
    SecureStore.setItem(name, value);
  },
  removeItem: (name: string): void => {
    SecureStore.deleteItemAsync(name).catch((error) =>
      console.error("Failed to clear secure auth storage:", error),
    );
  },
};
