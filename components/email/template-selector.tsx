"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTemplateStore } from "@/stores/template-store";
import { EmailTemplate } from "@/lib/jmap/types";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown } from "lucide-react";

interface TemplateSelectorProps {
  onSelectTemplate: (template: EmailTemplate) => void;
}

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const t = useTranslations('templates');
  const { templates } = useTemplateStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FileText className="w-4 h-4 mr-2" />
        {t('use_template')}
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {templates.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              {t('no_templates')}
            </div>
          ) : (
            <div className="py-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    onSelectTemplate(template);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{template.subject}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
