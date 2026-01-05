"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTemplateStore } from "@/stores/template-store";
import { EmailTemplate } from "@/lib/jmap/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateListProps {
  onSelectTemplate: (template: EmailTemplate) => void;
  onNewTemplate: () => void;
  selectedTemplateId?: string | null;
}

export function TemplateList({ onSelectTemplate, onNewTemplate, selectedTemplateId }: TemplateListProps) {
  const t = useTranslations('templates');
  const { searchTemplates, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useTemplateStore();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const filteredTemplates = searchTemplates(localSearchQuery);
  const categories = Array.from(new Set(useTemplateStore.getState().templates.map(t => t.category).filter(Boolean))) as string[];

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    setSearchQuery(value);
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewTemplate}
            title={t('add_template')}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('search_placeholder')}
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              variant={selectedCategory === null ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="text-xs whitespace-nowrap"
            >
              {t('all_categories')}
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-xs whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {localSearchQuery ? t('no_templates_found') : t('no_templates')}
            </p>
            {!localSearchQuery && (
              <Button variant="outline" size="sm" onClick={onNewTemplate}>
                <Plus className="w-4 h-4 mr-2" />
                {t('add_first_template')}
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className={cn(
                  "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                  selectedTemplateId === template.id && "bg-muted"
                )}
              >
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{template.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{template.subject}</div>
                    {template.category && (
                      <div className="text-xs text-muted-foreground mt-1">
                        <span className="px-2 py-0.5 bg-muted rounded">{template.category}</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="p-3 border-t text-xs text-muted-foreground text-center">
        {t('template_count', { count: filteredTemplates.length })}
      </div>
    </div>
  );
}
