"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchFilterStore } from "@/stores/search-filter-store";
import { SearchFilter } from "@/lib/jmap/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search, Filter, Save, Trash2 } from "lucide-react";

interface AdvancedSearchProps {
  onSearch: (filter: SearchFilter) => void;
  onClose?: () => void;
  mailboxes?: Array<{ id: string; name: string }>;
}

export function AdvancedSearch({ onSearch, onClose }: AdvancedSearchProps) {
  const t = useTranslations('search');
  const { currentFilter, updateFilter, resetFilter, savedFilters, saveFilter, deleteSavedFilter, loadSavedFilter } = useSearchFilterStore();
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState("");

  const handleSearch = () => {
    onSearch(currentFilter);
    onClose?.();
  };

  const handleReset = () => {
    resetFilter();
  };

  const handleSaveFilter = () => {
    if (saveFilterName.trim()) {
      saveFilter(saveFilterName.trim(), currentFilter);
      setSaveFilterName("");
      setShowSavedFilters(false);
    }
  };

  return (
    <div className="bg-background border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Filter className="w-4 h-4" />
          {t('advanced_search')}
        </h3>
        <div className="flex gap-2">
          {savedFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSavedFilters(!showSavedFilters)}
            >
              {t('saved_filters')} ({savedFilters.length})
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {showSavedFilters && savedFilters.length > 0 && (
        <div className="p-3 bg-muted rounded-md space-y-2">
          <h4 className="text-sm font-medium">{t('saved_filters')}</h4>
          <div className="space-y-1">
            {savedFilters.map((filter) => (
              <div key={filter.id} className="flex items-center justify-between text-sm">
                <button
                  onClick={() => {
                    loadSavedFilter(filter.id);
                    setShowSavedFilters(false);
                  }}
                  className="flex-1 text-left hover:text-primary"
                >
                  {filter.name}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSavedFilter(filter.id)}
                  className="h-6 w-6"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Text Search */}
        <div>
          <label className="text-sm font-medium mb-1 block">{t('text_search')}</label>
          <Input
            value={currentFilter.text || ''}
            onChange={(e) => updateFilter({ text: e.target.value })}
            placeholder={t('text_search_placeholder')}
          />
        </div>

        {/* From */}
        <div>
          <label className="text-sm font-medium mb-1 block">{t('from')}</label>
          <Input
            value={currentFilter.from?.join(', ') || ''}
            onChange={(e) => {
              const emails = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
              updateFilter({ from: emails.length > 0 ? emails : undefined });
            }}
            placeholder={t('from_placeholder')}
          />
        </div>

        {/* To */}
        <div>
          <label className="text-sm font-medium mb-1 block">{t('to')}</label>
          <Input
            value={currentFilter.to?.join(', ') || ''}
            onChange={(e) => {
              const emails = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
              updateFilter({ to: emails.length > 0 ? emails : undefined });
            }}
            placeholder={t('to_placeholder')}
          />
        </div>

        {/* Subject */}
        <div>
          <label className="text-sm font-medium mb-1 block">{t('subject')}</label>
          <Input
            value={currentFilter.subject || ''}
            onChange={(e) => updateFilter({ subject: e.target.value || undefined })}
            placeholder={t('subject_placeholder')}
          />
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">{t('date_from')}</label>
            <Input
              type="date"
              value={currentFilter.dateFrom ? new Date(currentFilter.dateFrom).toISOString().split('T')[0] : ''}
              onChange={(e) => updateFilter({ dateFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t('date_to')}</label>
            <Input
              type="date"
              value={currentFilter.dateTo ? new Date(currentFilter.dateTo).toISOString().split('T')[0] : ''}
              onChange={(e) => updateFilter({ dateTo: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
            />
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="text-sm font-medium block">{t('options')}</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={currentFilter.hasAttachment === true}
                onChange={(e) => updateFilter({ hasAttachment: e.target.checked ? true : undefined })}
              />
              <span className="text-sm">{t('has_attachment')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={currentFilter.isRead === true}
                onChange={(e) => updateFilter({ isRead: e.target.checked ? true : undefined })}
              />
              <span className="text-sm">{t('is_read')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={currentFilter.isRead === false}
                onChange={(e) => updateFilter({ isRead: e.target.checked ? false : undefined })}
              />
              <span className="text-sm">{t('is_unread')}</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={currentFilter.isStarred === true}
                onChange={(e) => updateFilter({ isStarred: e.target.checked ? true : undefined })}
              />
              <span className="text-sm">{t('is_starred')}</span>
            </label>
          </div>
        </div>

        {/* Save Filter */}
        <div className="flex gap-2">
          <Input
            value={saveFilterName}
            onChange={(e) => setSaveFilterName(e.target.value)}
            placeholder={t('save_filter_placeholder')}
            className="flex-1"
          />
          <Button onClick={handleSaveFilter} size="sm" disabled={!saveFilterName.trim()}>
            <Save className="w-4 h-4 mr-2" />
            {t('save_filter')}
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button onClick={handleSearch} className="flex-1">
          <Search className="w-4 h-4 mr-2" />
          {t('search')}
        </Button>
        <Button variant="ghost" onClick={handleReset}>
          {t('reset')}
        </Button>
      </div>
    </div>
  );
}
