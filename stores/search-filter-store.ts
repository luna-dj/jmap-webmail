import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SearchFilter } from "@/lib/jmap/types";

interface SearchFilterStore {
  currentFilter: SearchFilter;
  savedFilters: Array<{ id: string; name: string; filter: SearchFilter }>;
  
  // Filter operations
  updateFilter: (filter: Partial<SearchFilter>) => void;
  resetFilter: () => void;
  saveFilter: (name: string, filter: SearchFilter) => string;
  deleteSavedFilter: (id: string) => void;
  loadSavedFilter: (id: string) => void;
  
  // Build JMAP filter from SearchFilter
  buildJMAPFilter: (filter: SearchFilter, mailboxId?: string) => Record<string, unknown>;
}

const generateId = () => `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useSearchFilterStore = create<SearchFilterStore>()(
  persist(
    (set, get) => ({
      currentFilter: {},
      savedFilters: [],

      updateFilter: (updates) => {
        set((state) => ({
          currentFilter: { ...state.currentFilter, ...updates },
        }));
      },

      resetFilter: () => {
        set({ currentFilter: {} });
      },

      saveFilter: (name, filter) => {
        const id = generateId();
        set((state) => ({
          savedFilters: [...state.savedFilters, { id, name, filter }],
        }));
        return id;
      },

      deleteSavedFilter: (id) => {
        set((state) => ({
          savedFilters: state.savedFilters.filter((f) => f.id !== id),
        }));
      },

      loadSavedFilter: (id) => {
        const { savedFilters } = get();
        const saved = savedFilters.find((f) => f.id === id);
        if (saved) {
          set({ currentFilter: saved.filter });
        }
      },

      buildJMAPFilter: (filter, mailboxId) => {
        const jmapFilter: Record<string, unknown> = {};

        // Text search
        if (filter.text) {
          jmapFilter.text = filter.text;
        }

        // Mailbox filter
        if (mailboxId) {
          jmapFilter.inMailbox = mailboxId;
        } else if (filter.mailboxIds && filter.mailboxIds.length > 0) {
          jmapFilter.inMailbox = filter.mailboxIds[0]; // JMAP typically supports one mailbox at a time
        }

        // From filter
        if (filter.from && filter.from.length > 0) {
          jmapFilter.from = filter.from.map(email => ({ email }));
        }

        // To filter
        if (filter.to && filter.to.length > 0) {
          jmapFilter.to = filter.to.map(email => ({ email }));
        }

        // Subject filter
        if (filter.subject) {
          jmapFilter.subject = filter.subject;
        }

        // Has attachment
        if (filter.hasAttachment !== undefined) {
          // JMAP doesn't have a direct hasAttachment filter, but we can filter by size > 0
          // This is a workaround - actual implementation depends on server support
        }

        // Read status
        if (filter.isRead !== undefined) {
          jmapFilter.keywords = { $seen: filter.isRead };
        }

        // Starred
        if (filter.isStarred !== undefined) {
          if (!jmapFilter.keywords) {
            jmapFilter.keywords = {};
          }
          (jmapFilter.keywords as Record<string, boolean>).$flagged = filter.isStarred;
        }

        // Date range
        if (filter.dateFrom || filter.dateTo) {
          jmapFilter.after = filter.dateFrom;
          jmapFilter.before = filter.dateTo;
        }

        // Size range
        if (filter.sizeMin !== undefined || filter.sizeMax !== undefined) {
          if (filter.sizeMin !== undefined) {
            jmapFilter.minSize = filter.sizeMin;
          }
          if (filter.sizeMax !== undefined) {
            jmapFilter.maxSize = filter.sizeMax;
          }
        }

        return jmapFilter;
      },
    }),
    {
      name: 'search-filter-storage',
      partialize: (state) => ({
        savedFilters: state.savedFilters,
      }),
    }
  )
);
