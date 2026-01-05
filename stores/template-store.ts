import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EmailTemplate } from "@/lib/jmap/types";

interface TemplateStore {
  templates: EmailTemplate[];
  selectedTemplate: EmailTemplate | null;
  searchQuery: string;
  selectedCategory: string | null;

  // Template CRUD operations
  addTemplate: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<EmailTemplate>;
  updateTemplate: (id: string, template: Partial<EmailTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  getTemplate: (id: string) => EmailTemplate | null;
  searchTemplates: (query: string) => EmailTemplate[];
  getTemplatesByCategory: (category: string) => EmailTemplate[];

  // Template processing
  processTemplate: (template: EmailTemplate, variables: Record<string, string>) => { subject: string; body: string };

  // UI state
  setSelectedTemplate: (template: EmailTemplate | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
}

const generateId = () => `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      templates: [],
      selectedTemplate: null,
      searchQuery: "",
      selectedCategory: null,

      addTemplate: async (templateData) => {
        const now = new Date().toISOString();
        const template: EmailTemplate = {
          id: generateId(),
          ...templateData,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          templates: [...state.templates, template],
        }));

        return template;
      },

      updateTemplate: async (id, updates) => {
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === id
              ? { ...template, ...updates, updatedAt: new Date().toISOString() }
              : template
          ),
        }));
      },

      deleteTemplate: async (id) => {
        set((state) => ({
          templates: state.templates.filter((template) => template.id !== id),
          selectedTemplate: state.selectedTemplate?.id === id ? null : state.selectedTemplate,
        }));
      },

      getTemplate: (id) => {
        const { templates } = get();
        return templates.find((template) => template.id === id) || null;
      },

      searchTemplates: (query) => {
        const { templates, selectedCategory } = get();
        const lowerQuery = query.toLowerCase().trim();

        let filtered = templates;

        // Filter by category if selected
        if (selectedCategory) {
          filtered = filtered.filter((template) => template.category === selectedCategory);
        }

        // Filter by search query
        if (lowerQuery) {
          filtered = filtered.filter((template) => {
            const searchableText = [
              template.name,
              template.subject,
              template.body,
              template.category,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

            return searchableText.includes(lowerQuery);
          });
        }

        return filtered;
      },

      getTemplatesByCategory: (category) => {
        const { templates } = get();
        return templates.filter((template) => template.category === category);
      },

      processTemplate: (template, variables) => {
        let subject = template.subject;
        let body = template.body;

        // Replace variables in format {{variableName}}
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          subject = subject.replace(regex, value);
          body = body.replace(regex, value);
        });

        return { subject, body };
      },

      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
    }),
    {
      name: 'template-storage',
      partialize: (state) => ({
        templates: state.templates,
      }),
    }
  )
);
