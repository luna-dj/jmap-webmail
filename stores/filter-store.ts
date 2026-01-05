import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EmailFilter, FilterCondition, FilterAction, Email } from "@/lib/jmap/types";
import { JMAPClient } from "@/lib/jmap/client";

interface FilterStore {
  filters: EmailFilter[];
  selectedFilter: EmailFilter | null;

  // Filter CRUD operations
  addFilter: (filter: Omit<EmailFilter, 'id' | 'createdAt' | 'updatedAt'>) => Promise<EmailFilter>;
  updateFilter: (id: string, filter: Partial<EmailFilter>) => Promise<void>;
  deleteFilter: (id: string) => Promise<void>;
  getFilter: (id: string) => EmailFilter | null;
  toggleFilter: (id: string) => Promise<void>;

  // Filter execution
  executeFilters: (client: JMAPClient | null, email: Email) => Promise<void>;
  evaluateCondition: (condition: FilterCondition, email: Email) => boolean;
  executeAction: (client: JMAPClient | null, action: FilterAction, email: Email) => Promise<void>;

  // UI state
  setSelectedFilter: (filter: EmailFilter | null) => void;
}

const generateId = () => `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      filters: [],
      selectedFilter: null,

      addFilter: async (filterData) => {
        const now = new Date().toISOString();
        const filter: EmailFilter = {
          id: generateId(),
          ...filterData,
          priority: filterData.priority ?? 100,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          filters: [...state.filters, filter].sort((a, b) => (a.priority || 100) - (b.priority || 100)),
        }));

        return filter;
      },

      updateFilter: async (id, updates) => {
        set((state) => {
          const updatedFilters = state.filters.map((filter) =>
            filter.id === id
              ? { ...filter, ...updates, updatedAt: new Date().toISOString() }
              : filter
          );
          return {
            filters: updatedFilters.sort((a, b) => (a.priority || 100) - (b.priority || 100)),
          };
        });
      },

      deleteFilter: async (id) => {
        set((state) => ({
          filters: state.filters.filter((filter) => filter.id !== id),
          selectedFilter: state.selectedFilter?.id === id ? null : state.selectedFilter,
        }));
      },

      getFilter: (id) => {
        const { filters } = get();
        return filters.find((filter) => filter.id === id) || null;
      },

      toggleFilter: async (id) => {
        const filter = get().getFilter(id);
        if (filter) {
          await get().updateFilter(id, { enabled: !filter.enabled });
        }
      },

      evaluateCondition: (condition, email) => {
        switch (condition.type) {
          case 'from': {
            const fromEmails = email.from?.map(f => f.email?.toLowerCase() || '').filter(Boolean) || [];
            const fromValue = condition.value.toLowerCase();
            return fromEmails.some(email => {
              switch (condition.operator) {
                case 'contains': return email.includes(fromValue);
                case 'equals': return email === fromValue;
                case 'startsWith': return email.startsWith(fromValue);
                case 'endsWith': return email.endsWith(fromValue);
                default: return false;
              }
            });
          }

          case 'to': {
            const toEmails = email.to?.map(t => t.email?.toLowerCase() || '').filter(Boolean) || [];
            const toValue = condition.value.toLowerCase();
            return toEmails.some(email => {
              switch (condition.operator) {
                case 'contains': return email.includes(toValue);
                case 'equals': return email === toValue;
                case 'startsWith': return email.startsWith(toValue);
                case 'endsWith': return email.endsWith(toValue);
                default: return false;
              }
            });
          }

          case 'subject': {
            const subject = (email.subject || '').toLowerCase();
            const subjectValue = condition.value.toLowerCase();
            switch (condition.operator) {
              case 'contains': return subject.includes(subjectValue);
              case 'equals': return subject === subjectValue;
              case 'startsWith': return subject.startsWith(subjectValue);
              case 'endsWith': return subject.endsWith(subjectValue);
              default: return false;
            }
          }

          case 'body': {
            // This would require fetching the full email body, which might not be available
            // For now, we'll check the preview
            const body = (email.preview || '').toLowerCase();
            const bodyValue = condition.value.toLowerCase();
            switch (condition.operator) {
              case 'contains': return body.includes(bodyValue);
              case 'equals': return body === bodyValue;
              case 'startsWith': return body.startsWith(bodyValue);
              case 'endsWith': return body.endsWith(bodyValue);
              default: return false;
            }
          }

          case 'hasAttachment':
            return email.hasAttachment === condition.value;

          case 'size': {
            const size = email.size || 0;
            switch (condition.operator) {
              case 'greaterThan': return size > condition.value;
              case 'lessThan': return size < condition.value;
              case 'equals': return size === condition.value;
              default: return false;
            }
          }

          case 'date': {
            if (!email.receivedAt) return false;
            const emailDate = new Date(email.receivedAt);
            const conditionDate = new Date(condition.value);
            switch (condition.operator) {
              case 'before': return emailDate < conditionDate;
              case 'after': return emailDate > conditionDate;
              case 'equals': return emailDate.toDateString() === conditionDate.toDateString();
              default: return false;
            }
          }

          case 'isRead':
            return (email.keywords?.$seen || false) === condition.value;

          case 'isStarred':
            return (email.keywords?.$flagged || false) === condition.value;

          default:
            return false;
        }
      },

      executeAction: async (client, action, email) => {
        if (!client) return;

        try {
          switch (action.type) {
            case 'moveToMailbox':
              await client.moveEmail(email.id, action.mailboxId);
              break;

            case 'markAsRead':
              await client.updateEmailKeywords(email.id, { $seen: action.read });
              break;

            case 'star':
              await client.updateEmailKeywords(email.id, { $flagged: action.starred });
              break;

            case 'delete':
              await client.deleteEmail(email.id);
              break;

            case 'forward':
              // Forwarding would require creating a new email
              // This is a placeholder for future implementation
              console.log('Forward action not yet implemented:', action);
              break;

            case 'addLabel':
            case 'removeLabel':
              // Label management would depend on server support
              // This is a placeholder for future implementation
              console.log('Label action not yet implemented:', action);
              break;
          }
        } catch (error) {
          console.error('Failed to execute filter action:', error);
        }
      },

      executeFilters: async (client, email) => {
        if (!client) return;

        const { filters } = get();
        const enabledFilters = filters.filter(f => f.enabled).sort((a, b) => (a.priority || 100) - (b.priority || 100));

        for (const filter of enabledFilters) {
          if (filter.conditions.length === 0) continue;

          const { evaluateCondition, executeAction } = get();
          const matchAll = filter.matchAll !== false; // Default to AND

          let matches: boolean;
          if (matchAll) {
            // All conditions must match (AND)
            matches = filter.conditions.every(condition => evaluateCondition(condition, email));
          } else {
            // Any condition matches (OR)
            matches = filter.conditions.some(condition => evaluateCondition(condition, email));
          }

          if (matches) {
            // Execute all actions
            for (const action of filter.actions) {
              await executeAction(client, action, email);
            }

            // Stop processing if this filter should stop on match
            if (filter.stopOnMatch) {
              break;
            }
          }
        }
      },

      setSelectedFilter: (filter) => set({ selectedFilter: filter }),
    }),
    {
      name: 'filter-storage',
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
);
