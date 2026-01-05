import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EmailAlias } from "@/lib/jmap/types";
import { JMAPClient } from "@/lib/jmap/client";

interface AliasStore {
  aliases: EmailAlias[];
  selectedAlias: EmailAlias | null;

  // Alias CRUD operations
  addAlias: (alias: Omit<EmailAlias, 'id' | 'createdAt' | 'updatedAt'>) => Promise<EmailAlias>;
  updateAlias: (id: string, alias: Partial<EmailAlias>) => Promise<void>;
  deleteAlias: (id: string) => Promise<void>;
  getAlias: (id: string) => EmailAlias | null;
  getDefaultAlias: () => EmailAlias | null;
  setDefaultAlias: (id: string) => Promise<void>;
  getAliasByEmail: (email: string) => EmailAlias | null;

  // JMAP sync operations
  syncAliases: (client: JMAPClient | null) => Promise<void>;
  fetchAliases: (client: JMAPClient | null) => Promise<void>;

  // UI state
  setSelectedAlias: (alias: EmailAlias | null) => void;
}

const generateId = () => `alias-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useAliasStore = create<AliasStore>()(
  persist(
    (set, get) => ({
      aliases: [],
      selectedAlias: null,

      addAlias: async (aliasData) => {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(aliasData.email)) {
          throw new Error('Invalid email address');
        }

        // Check for duplicate emails
        const existing = get().getAliasByEmail(aliasData.email);
        if (existing) {
          throw new Error('Alias with this email already exists');
        }

        const now = new Date().toISOString();
        const alias: EmailAlias = {
          id: generateId(),
          ...aliasData,
          createdAt: now,
          updatedAt: now,
        };

        // If this is set as default, unset other defaults
        if (aliasData.isDefault) {
          set((state) => ({
            aliases: state.aliases.map((a) => ({ ...a, isDefault: false })),
          }));
        }

        set((state) => ({
          aliases: [...state.aliases, alias],
        }));

        return alias;
      },

      updateAlias: async (id, updates) => {
        // Validate email format if email is being updated
        if (updates.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(updates.email)) {
            throw new Error('Invalid email address');
          }

          // Check for duplicate emails (excluding current alias)
          const existing = get().getAliasByEmail(updates.email);
          if (existing && existing.id !== id) {
            throw new Error('Alias with this email already exists');
          }
        }

        // If setting as default, unset other defaults
        if (updates.isDefault) {
          set((state) => ({
            aliases: state.aliases.map((a) =>
              a.id === id ? { ...a, ...updates, isDefault: true, updatedAt: new Date().toISOString() } : { ...a, isDefault: false }
            ),
          }));
        } else {
          set((state) => ({
            aliases: state.aliases.map((alias) =>
              alias.id === id
                ? { ...alias, ...updates, updatedAt: new Date().toISOString() }
                : alias
            ),
          }));
        }
      },

      deleteAlias: async (id) => {
        set((state) => ({
          aliases: state.aliases.filter((alias) => alias.id !== id),
          selectedAlias: state.selectedAlias?.id === id ? null : state.selectedAlias,
        }));
      },

      getAlias: (id) => {
        const { aliases } = get();
        return aliases.find((alias) => alias.id === id) || null;
      },

      getDefaultAlias: () => {
        const { aliases } = get();
        return aliases.find((a) => a.isDefault) || aliases[0] || null;
      },

      getAliasByEmail: (email) => {
        const { aliases } = get();
        return aliases.find((alias) => alias.email.toLowerCase() === email.toLowerCase()) || null;
      },

      setDefaultAlias: async (id) => {
        set((state) => ({
          aliases: state.aliases.map((a) => ({
            ...a,
            isDefault: a.id === id,
          })),
        }));
      },

      syncAliases: async (client) => {
        if (!client) return;
        try {
          await get().fetchAliases(client);
        } catch (error) {
          console.error('Failed to sync aliases:', error);
        }
      },

      fetchAliases: async (client) => {
        // TODO: Implement JMAP alias fetching when server supports it
        // For now, use local storage only
        // Some servers might expose aliases through Identity/get or a custom extension
        if (!client) return;
        try {
          // Check if server supports aliases extension
          // If yes, fetch from server
          // If no, use local storage (already persisted)
        } catch (error) {
          console.error('Failed to fetch aliases:', error);
        }
      },

      setSelectedAlias: (alias) => set({ selectedAlias: alias }),
    }),
    {
      name: 'alias-storage',
      partialize: (state) => ({
        aliases: state.aliases,
      }),
    }
  )
);
