import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Contact, ContactGroup } from "@/lib/jmap/types";
import { JMAPClient } from "@/lib/jmap/client";
import { useAuthStore } from "./auth-store";

interface ContactStore {
  contacts: Contact[];
  groups: ContactGroup[];
  selectedContact: Contact | null;
  searchQuery: string;
  selectedGroup: string | null;
  isLoading: boolean;
  error: string | null;

  // Contact CRUD operations
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Contact>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  getContact: (id: string) => Contact | null;
  searchContacts: (query: string) => Contact[];
  getContactsByGroup: (groupId: string) => Contact[];

  // Group CRUD operations
  addGroup: (group: Omit<ContactGroup, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ContactGroup>;
  updateGroup: (id: string, group: Partial<ContactGroup>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  getGroup: (id: string) => ContactGroup | null;

  // JMAP sync operations
  syncContacts: (client: JMAPClient | null) => Promise<void>;
  fetchContacts: (client: JMAPClient | null) => Promise<void>;

  // UI state
  setSelectedContact: (contact: Contact | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedGroup: (groupId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Autocomplete helpers
  getContactsForAutocomplete: (query: string) => Array<{ name: string; email: string }>;

  // Auto-add contacts from email addresses
  addContactsFromEmails: (emails: string[]) => Promise<void>;
}

const generateId = () => `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useContactStore = create<ContactStore>()(
  persist(
    (set, get) => ({
      contacts: [],
      groups: [],
      selectedContact: null,
      searchQuery: "",
      selectedGroup: null,
      isLoading: false,
      error: null,

      addContact: async (contactData) => {
        const now = new Date().toISOString();
        let contactId = generateId();
        let contact: Contact = {
          id: contactId,
          ...contactData,
          createdAt: now,
          updatedAt: now,
        };

        // Try to save to JMAP if client is available
        const client = useAuthStore.getState().client;
        if (client && client.supportsAddressBook()) {
          try {
            const jmapContactId = await client.createContact(contactData);
            contactId = jmapContactId;
            contact = {
              ...contact,
              id: jmapContactId,
            };
          } catch (error) {
            console.error('Failed to save contact to JMAP, using local ID:', error);
            // Continue with local ID if JMAP save fails
          }
        }

        set((state) => ({
          contacts: [...state.contacts, contact],
        }));

        return contact;
      },

      updateContact: async (id, updates) => {
        const updatedContact = { ...updates, updatedAt: new Date().toISOString() };

        // Try to save to JMAP if client is available
        const client = useAuthStore.getState().client;
        if (client && client.supportsAddressBook()) {
          try {
            await client.updateContact(id, updates);
          } catch (error) {
            console.error('Failed to update contact in JMAP:', error);
            // Continue with local update if JMAP update fails
          }
        }

        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id
              ? { ...contact, ...updatedContact }
              : contact
          ),
        }));
      },

      deleteContact: async (id) => {
        // Try to delete from JMAP if client is available
        const client = useAuthStore.getState().client;
        if (client && client.supportsAddressBook()) {
          try {
            await client.deleteContact(id);
          } catch (error) {
            console.error('Failed to delete contact from JMAP:', error);
            // Continue with local delete if JMAP delete fails
          }
        }

        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== id),
          selectedContact: state.selectedContact?.id === id ? null : state.selectedContact,
        }));

        // Remove from groups
        set((state) => ({
          groups: state.groups.map((group) => ({
            ...group,
            contactIds: group.contactIds.filter((contactId) => contactId !== id),
          })),
        }));
      },

      getContact: (id) => {
        const { contacts } = get();
        return contacts.find((contact) => contact.id === id) || null;
      },

      searchContacts: (query) => {
        const { contacts, selectedGroup } = get();
        const lowerQuery = query.toLowerCase().trim();

        if (!lowerQuery && !selectedGroup) {
          return contacts;
        }

        let filtered = contacts;

        // Filter by group if selected
        if (selectedGroup) {
          filtered = filtered.filter((contact) =>
            contact.groups?.includes(selectedGroup)
          );
        }

        // Filter by search query
        if (lowerQuery) {
          filtered = filtered.filter((contact) => {
            const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
            const email = contact.email || '';
            const emails = contact.emails || [];
            const company = contact.company || '';
            const phone = contact.phone || '';
            const phones = contact.phones || [];

            const searchableText = [
              name,
              email,
              ...emails,
              company,
              phone,
              ...phones,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

            return searchableText.includes(lowerQuery);
          });
        }

        return filtered;
      },

      getContactsByGroup: (groupId) => {
        const { contacts } = get();
        return contacts.filter((contact) => contact.groups?.includes(groupId));
      },

      addGroup: async (groupData) => {
        const now = new Date().toISOString();
        const group: ContactGroup = {
          id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...groupData,
          contactIds: groupData.contactIds || [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          groups: [...state.groups, group],
        }));

        return group;
      },

      updateGroup: async (id, updates) => {
        set((state) => ({
          groups: state.groups.map((group) =>
            group.id === id
              ? { ...group, ...updates, updatedAt: new Date().toISOString() }
              : group
          ),
        }));
      },

      deleteGroup: async (id) => {
        // Remove group from contacts
        set((state) => ({
          contacts: state.contacts.map((contact) => ({
            ...contact,
            groups: contact.groups?.filter((groupId) => groupId !== id),
          })),
        }));

        // Delete the group
        set((state) => ({
          groups: state.groups.filter((group) => group.id !== id),
        }));
      },

      getGroup: (id) => {
        const { groups } = get();
        return groups.find((group) => group.id === id) || null;
      },

      syncContacts: async (client) => {
        // TODO: Implement JMAP contacts sync when server supports it
        // For now, we'll use local storage only
        if (!client) return;

        try {
          // Check if server supports contacts
          // This would use JMAP Contacts extension if available
          // For now, we'll just fetch from local storage
          await get().fetchContacts(client);
        } catch (error) {
          console.error('Failed to sync contacts:', error);
          // Fall back to local storage
        }
      },

      fetchContacts: async (client) => {
        if (!client) return;

        try {
          if (client.supportsAddressBook()) {
            const jmapContacts = await client.getContacts();
            
            // Merge with local contacts, preferring JMAP contacts
            set((state) => {
              const localContacts = state.contacts;
              const jmapContactIds = new Set(jmapContacts.map(c => c.id));
              
              // Keep local contacts that aren't in JMAP (for offline support)
              const localOnlyContacts = localContacts.filter(c => !jmapContactIds.has(c.id));
              
              // Combine: JMAP contacts first, then local-only contacts
              const mergedContacts = [...jmapContacts, ...localOnlyContacts];
              
              return {
                contacts: mergedContacts,
              };
            });
          }
        } catch (error) {
          console.error('Failed to fetch contacts:', error);
          // Fall back to local storage (already persisted)
        }
      },

      setSelectedContact: (contact) => set({ selectedContact: contact }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedGroup: (groupId) => set({ selectedGroup: groupId }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      getContactsForAutocomplete: (query) => {
        const { contacts } = get();
        const lowerQuery = query.toLowerCase().trim();

        if (!lowerQuery) {
          return contacts
            .slice(0, 10)
            .map((contact) => {
              const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email;
              return { name, email: contact.email };
            });
        }

        return contacts
          .filter((contact) => {
            const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
            const email = contact.email || '';
            const searchable = `${name} ${email}`.toLowerCase();
            return searchable.includes(lowerQuery);
          })
          .slice(0, 10)
          .map((contact) => {
            const name = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email;
            return { name, email: contact.email };
          });
      },

      addContactsFromEmails: async (emails) => {
        const { contacts, addContact } = get();
        const emailSet = new Set(emails.map(e => e.toLowerCase().trim()).filter(Boolean));

        // Check which emails don't exist in contacts
        const existingEmails = new Set(
          contacts.map(c => c.email.toLowerCase())
            .concat(contacts.flatMap(c => (c.emails || []).map(e => e.toLowerCase())))
        );

        // Add contacts for emails that don't exist
        for (const email of emailSet) {
          if (!existingEmails.has(email)) {
            try {
              await addContact({
                email,
                name: email.split('@')[0], // Use the part before @ as a default name
              });
            } catch (error) {
              console.error(`Failed to add contact for ${email}:`, error);
              // Continue with other emails even if one fails
            }
          }
        }
      },
    }),
    {
      name: 'contact-storage',
      partialize: (state) => ({
        contacts: state.contacts,
        groups: state.groups,
      }),
    }
  )
);
