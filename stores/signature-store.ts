import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EmailSignature } from "@/lib/jmap/types";

interface SignatureStore {
  signatures: EmailSignature[];
  selectedSignature: EmailSignature | null;

  // Signature CRUD operations
  addSignature: (signature: Omit<EmailSignature, 'id' | 'createdAt' | 'updatedAt'>) => Promise<EmailSignature>;
  updateSignature: (id: string, signature: Partial<EmailSignature>) => Promise<void>;
  deleteSignature: (id: string) => Promise<void>;
  getSignature: (id: string) => EmailSignature | null;
  getDefaultSignature: () => EmailSignature | null;
  setDefaultSignature: (id: string) => Promise<void>;

  // UI state
  setSelectedSignature: (signature: EmailSignature | null) => void;
}

const generateId = () => `signature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useSignatureStore = create<SignatureStore>()(
  persist(
    (set, get) => ({
      signatures: [],
      selectedSignature: null,

      addSignature: async (signatureData) => {
        const now = new Date().toISOString();
        const signature: EmailSignature = {
          id: generateId(),
          ...signatureData,
          createdAt: now,
          updatedAt: now,
        };

        // If this is set as default, unset other defaults
        if (signatureData.isDefault) {
          set((state) => ({
            signatures: state.signatures.map((s) => ({ ...s, isDefault: false })),
          }));
        }

        set((state) => ({
          signatures: [...state.signatures, signature],
        }));

        return signature;
      },

      updateSignature: async (id, updates) => {
        // If setting as default, unset other defaults
        if (updates.isDefault) {
          set((state) => ({
            signatures: state.signatures.map((s) =>
              s.id === id ? { ...s, ...updates, isDefault: true, updatedAt: new Date().toISOString() } : { ...s, isDefault: false }
            ),
          }));
        } else {
          set((state) => ({
            signatures: state.signatures.map((signature) =>
              signature.id === id
                ? { ...signature, ...updates, updatedAt: new Date().toISOString() }
                : signature
            ),
          }));
        }
      },

      deleteSignature: async (id) => {
        set((state) => ({
          signatures: state.signatures.filter((signature) => signature.id !== id),
          selectedSignature: state.selectedSignature?.id === id ? null : state.selectedSignature,
        }));
      },

      getSignature: (id) => {
        const { signatures } = get();
        return signatures.find((signature) => signature.id === id) || null;
      },

      getDefaultSignature: () => {
        const { signatures } = get();
        return signatures.find((s) => s.isDefault) || signatures[0] || null;
      },

      setDefaultSignature: async (id) => {
        set((state) => ({
          signatures: state.signatures.map((s) => ({
            ...s,
            isDefault: s.id === id,
          })),
        }));
      },

      setSelectedSignature: (signature) => set({ selectedSignature: signature }),
    }),
    {
      name: 'signature-storage',
      partialize: (state) => ({
        signatures: state.signatures,
      }),
    }
  )
);
