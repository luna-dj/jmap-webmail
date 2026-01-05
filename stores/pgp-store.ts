import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PGPKey } from "@/lib/jmap/types";

interface PGPStore {
  keys: PGPKey[];
  selectedKey: PGPKey | null;
  defaultEncryptionKey: PGPKey | null;
  defaultSigningKey: PGPKey | null;

  // Key CRUD operations
  addKey: (key: Omit<PGPKey, 'id' | 'createdAt'>) => Promise<PGPKey>;
  updateKey: (id: string, updates: Partial<PGPKey>) => Promise<void>;
  deleteKey: (id: string) => Promise<void>;
  getKey: (id: string) => PGPKey | null;
  getKeyByEmail: (email: string) => PGPKey[];
  getKeyByFingerprint: (fingerprint: string) => PGPKey | null;

  // Key management
  setDefaultEncryptionKey: (id: string) => Promise<void>;
  setDefaultSigningKey: (id: string) => Promise<void>;
  importKey: (keyData: string) => Promise<PGPKey | null>;
  exportKey: (id: string, includePrivate?: boolean) => Promise<string | null>;

  // UI state
  setSelectedKey: (key: PGPKey | null) => void;
}

const generateId = () => `pgp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const usePGPStore = create<PGPStore>()(
  persist(
    (set, get) => ({
      keys: [],
      selectedKey: null,
      defaultEncryptionKey: null,
      defaultSigningKey: null,

      addKey: async (keyData) => {
        const key: PGPKey = {
          id: generateId(),
          ...keyData,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          keys: [...state.keys, key],
        }));

        return key;
      },

      updateKey: async (id, updates) => {
        set((state) => ({
          keys: state.keys.map((key) =>
            key.id === id ? { ...key, ...updates } : key
          ),
        }));
      },

      deleteKey: async (id) => {
        set((state) => ({
          keys: state.keys.filter((key) => key.id !== id),
          selectedKey: state.selectedKey?.id === id ? null : state.selectedKey,
          defaultEncryptionKey: state.defaultEncryptionKey?.id === id ? null : state.defaultEncryptionKey,
          defaultSigningKey: state.defaultSigningKey?.id === id ? null : state.defaultSigningKey,
        }));
      },

      getKey: (id) => {
        const { keys } = get();
        return keys.find((key) => key.id === id) || null;
      },

      getKeyByEmail: (email) => {
        const { keys } = get();
        return keys.filter((key) => key.email.toLowerCase() === email.toLowerCase());
      },

      getKeyByFingerprint: (fingerprint) => {
        const { keys } = get();
        return keys.find((key) => key.fingerprint === fingerprint) || null;
      },

      setDefaultEncryptionKey: async (id) => {
        const key = get().getKey(id);
        if (key) {
          set({ defaultEncryptionKey: key });
        }
      },

      setDefaultSigningKey: async (id) => {
        const key = get().getKey(id);
        if (key) {
          set({ defaultSigningKey: key });
        }
      },

      importKey: async (keyData) => {
        // TODO: Parse PGP key data using openpgp library
        // For now, return null as placeholder
        // This will be implemented when we add the openpgp library
        try {
          // Placeholder - actual implementation will use openpgp.js
          console.log('Import key placeholder:', keyData);
          return null;
        } catch (error) {
          console.error('Failed to import key:', error);
          return null;
        }
      },

      exportKey: async (id, includePrivate = false) => {
        const key = get().getKey(id);
        if (!key) return null;

        // TODO: Export key in proper format using openpgp library
        // For now, return the public key
        if (includePrivate && key.privateKey) {
          return `${key.publicKey}\n${key.privateKey}`;
        }
        return key.publicKey;
      },

      setSelectedKey: (key) => set({ selectedKey: key }),
    }),
    {
      name: 'pgp-storage',
      partialize: (state) => ({
        keys: state.keys,
        defaultEncryptionKey: state.defaultEncryptionKey,
        defaultSigningKey: state.defaultSigningKey,
      }),
    }
  )
);
