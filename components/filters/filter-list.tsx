"use client";

import { useTranslations } from "next-intl";
import { useFilterStore } from "@/stores/filter-store";
import { EmailFilter } from "@/lib/jmap/types";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterListProps {
  onSelectFilter: (filter: EmailFilter) => void;
  onNewFilter: () => void;
  selectedFilterId?: string;
}

export function FilterList({ onSelectFilter, onNewFilter, selectedFilterId }: FilterListProps) {
  const t = useTranslations('filters');
  const { filters, toggleFilter, deleteFilter } = useFilterStore();

  const handleToggle = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFilter(id);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('delete_confirm'))) {
      await deleteFilter(id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Button onClick={onNewFilter} className="w-full">
          {t('new_filter')}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filters.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {t('no_filters')}
          </div>
        ) : (
          <div className="divide-y">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className={cn(
                  "p-4 cursor-pointer hover:bg-muted transition-colors",
                  selectedFilterId === filter.id && "bg-accent"
                )}
                onClick={() => onSelectFilter(filter)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{filter.name}</h4>
                      {!filter.enabled && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded">
                          {t('disabled')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {filter.conditions.length} {t('conditions')}, {filter.actions.length} {t('actions')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleToggle(filter.id, e)}
                      title={filter.enabled ? t('disable') : t('enable')}
                    >
                      {filter.enabled ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFilter(filter);
                      }}
                      title={t('edit')}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(filter.id, e)}
                      title={t('delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
