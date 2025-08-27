import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

// By removing the explicit `: StateStorage` type annotation, we let TypeScript
// infer a stricter, synchronous type. This inferred type is compatible with
// both Zustand's `persist` middleware and TanStack Query's `createSyncStoragePersister`.
export const mmkvStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.delete(name);
  },
};
