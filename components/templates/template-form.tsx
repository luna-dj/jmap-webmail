"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTemplateStore } from "@/stores/template-store";
import { EmailTemplate } from "@/lib/jmap/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Save, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateFormProps {
  template?: EmailTemplate | null;
  onSave: () => void;
  onCancel: () => void;
}

export function TemplateForm({ template, onSave, onCancel }: TemplateFormProps) {
  const t = useTranslations('templates');
  const { addTemplate, updateTemplate } = useTemplateStore();

  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    body: template?.body || '',
    category: template?.category || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        body: template.body || '',
        category: template.category || '',
      });
    }
  }, [template]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('name_required');
    }

    if (!formData.subject.trim()) {
      newErrors.subject = t('subject_required');
    }

    if (!formData.body.trim()) {
      newErrors.body = t('body_required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      // Extract variables from template ({{variableName}} format)
      const variableRegex = /\{\{(\w+)\}\}/g;
      const variables: string[] = [];
      let match;
      while ((match = variableRegex.exec(formData.subject + formData.body)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }

      const templateData: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        subject: formData.subject.trim(),
        body: formData.body.trim(),
        category: formData.category.trim() || undefined,
        variables: variables.length > 0 ? variables : undefined,
      };

      if (template) {
        await updateTemplate(template.id, templateData);
      } else {
        await addTemplate(templateData);
      }

      onSave();
    } catch (error) {
      console.error('Failed to save template:', error);
      setErrors({ submit: t('save_error') });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{t('basic_information')}</h3>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              {t('name')} <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('name_placeholder')}
              className={cn(errors.name && "border-red-500")}
              required
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              {t('category')} <span className="text-xs">({t('optional')})</span>
            </label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder={t('category_placeholder')}
            />
          </div>
        </div>

        {/* Template Content */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{t('template_content')}</h3>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              {t('subject')} <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder={t('subject_placeholder')}
              className={cn(errors.subject && "border-red-500")}
              required
            />
            {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              {t('body')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder={t('body_placeholder')}
              className={cn(
                "w-full min-h-[200px] p-3 border rounded-md resize-none outline-none text-sm",
                errors.body && "border-red-500"
              )}
              rows={10}
              required
            />
            {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body}</p>}
          </div>

          {/* Variables info */}
          <div className="bg-muted/50 p-3 rounded-md text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">{t('variables_info_title')}</p>
                <p className="text-muted-foreground text-xs">
                  {t('variables_info_description')}
                </p>
                <p className="text-muted-foreground text-xs mt-2 font-mono">
                  {t('variables_example')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {errors.submit && (
          <div className="text-sm text-red-500">{errors.submit}</div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          {t('cancel')}
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
