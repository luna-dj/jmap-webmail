"use client";

import { useState } from "react";
import { TemplateList } from "@/components/templates/template-list";
import { TemplateForm } from "@/components/templates/template-form";
import { useTemplateStore } from "@/stores/template-store";
import { EmailTemplate } from "@/lib/jmap/types";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function TemplatesPage() {
  const t = useTranslations('templates');
  const { selectedTemplate, setSelectedTemplate, deleteTemplate } = useTemplateStore();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setView('list');
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setView('form');
  };

  const handleEditTemplate = () => {
    if (selectedTemplate) {
      setEditingTemplate(selectedTemplate);
      setView('form');
    }
  };

  const handleDeleteTemplate = async () => {
    if (selectedTemplate && window.confirm(t('delete_confirm', { name: selectedTemplate.name }))) {
      await deleteTemplate(selectedTemplate.id);
      setSelectedTemplate(null);
    }
  };

  const handleSaveTemplate = () => {
    setView('list');
    setEditingTemplate(null);
    setSelectedTemplate(null);
  };

  const handleCancelForm = () => {
    setView('list');
    setEditingTemplate(null);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Template List */}
      <div className="w-80 flex-shrink-0">
        <TemplateList
          onSelectTemplate={handleSelectTemplate}
          onNewTemplate={handleNewTemplate}
          selectedTemplateId={selectedTemplate?.id}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {view === 'form' ? (
          <div className="flex-1">
            <TemplateForm
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onCancel={handleCancelForm}
            />
          </div>
        ) : selectedTemplate ? (
          <div className="flex-1 flex flex-col bg-background">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-semibold mb-2">{selectedTemplate.name}</h2>
                  {selectedTemplate.category && (
                    <span className="inline-block px-2 py-1 text-xs bg-muted rounded">
                      {selectedTemplate.category}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleEditTemplate}>
                    {t('edit')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDeleteTemplate}>
                    {t('delete')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-2">{t('subject')}</h3>
                <p className="text-sm">{selectedTemplate.subject}</p>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">{t('body')}</h3>
                <div className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md">
                  {selectedTemplate.body}
                </div>
              </div>

              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">{t('variables')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">{t('select_template')}</p>
              <p className="text-sm">{t('select_template_description')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
