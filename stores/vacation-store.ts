import { create } from "zustand";
import { persist } from "zustand/middleware";
import { VacationResponder } from "@/lib/jmap/types";
import { JMAPClient } from "@/lib/jmap/client";

interface VacationStore {
  vacationResponders: VacationResponder[];
  selectedResponder: VacationResponder | null;

  // Vacation responder CRUD operations
  addVacationResponder: (responder: Omit<VacationResponder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VacationResponder>;
  updateVacationResponder: (id: string, responder: Partial<VacationResponder>) => Promise<void>;
  deleteVacationResponder: (id: string) => Promise<void>;
  getVacationResponder: (id: string) => VacationResponder | null;
  getActiveVacationResponder: () => VacationResponder | null;

  // JMAP sync operations
  syncVacationResponder: (client: JMAPClient | null) => Promise<void>;
  fetchVacationResponder: (client: JMAPClient | null) => Promise<void>;
  updateVacationResponderOnServer: (client: JMAPClient | null, responder: VacationResponder) => Promise<void>;

  // UI state
  setSelectedResponder: (responder: VacationResponder | null) => void;
}

const generateId = () => `vacation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useVacationStore = create<VacationStore>()(
  persist(
    (set, get) => ({
      vacationResponders: [],
      selectedResponder: null,

      addVacationResponder: async (responderData) => {
        const now = new Date().toISOString();
        const responder: VacationResponder = {
          id: generateId(),
          ...responderData,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          vacationResponders: [...state.vacationResponders, responder],
        }));

        // Try to sync with server
        // Note: sync will be implemented when server supports it
        void get().syncVacationResponder;

        return responder;
      },

      updateVacationResponder: async (id, updates) => {
        set((state) => ({
          vacationResponders: state.vacationResponders.map((responder) =>
            responder.id === id
              ? { ...responder, ...updates, updatedAt: new Date().toISOString() }
              : responder
          ),
        }));

        // Try to sync with server
        const responder = get().getVacationResponder(id);
        if (responder) {
          // Note: sync will be implemented when server supports it
          void get().updateVacationResponderOnServer;
        }
      },

      deleteVacationResponder: async (id) => {
        set((state) => ({
          vacationResponders: state.vacationResponders.filter((responder) => responder.id !== id),
          selectedResponder: state.selectedResponder?.id === id ? null : state.selectedResponder,
        }));
      },

      getVacationResponder: (id) => {
        const { vacationResponders } = get();
        return vacationResponders.find((responder) => responder.id === id) || null;
      },

      getActiveVacationResponder: () => {
        const { vacationResponders } = get();
        const now = new Date();
        return vacationResponders.find((responder) => {
          if (!responder.enabled) return false;
          const fromDate = responder.fromDate ? new Date(responder.fromDate) : null;
          const toDate = responder.toDate ? new Date(responder.toDate) : null;
          
          if (fromDate && now < fromDate) return false;
          if (toDate && now > toDate) return false;
          
          return true;
        }) || null;
      },

      syncVacationResponder: async (client) => {
        if (!client) return;
        try {
          await get().fetchVacationResponder(client);
        } catch (error) {
          console.error('Failed to sync vacation responder:', error);
        }
      },

      fetchVacationResponder: async (client) => {
        // TODO: Implement JMAP VacationResponse/get when server supports it
        // For now, use local storage only
        if (!client) return;
        try {
          // Check if server supports vacation responder extension
          // If yes, fetch from server
          // If no, use local storage (already persisted)
        } catch (error) {
          console.error('Failed to fetch vacation responder:', error);
        }
      },

      updateVacationResponderOnServer: async (client, _responder) => {
        // TODO: Implement JMAP VacationResponse/set when server supports it
        if (!client) return;
        try {
          // Update vacation responder on server
        } catch (error) {
          console.error('Failed to update vacation responder on server:', error);
        }
      },

      setSelectedResponder: (responder) => set({ selectedResponder: responder }),
    }),
    {
      name: 'vacation-storage',
      partialize: (state) => ({
        vacationResponders: state.vacationResponders,
      }),
    }
  )
);
