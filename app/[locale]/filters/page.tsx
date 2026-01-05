"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FilterList } from "@/components/filters/filter-list";
import { FilterForm } from "@/components/filters/filter-form";
import { useFilterStore } from "@/stores/filter-store";
import { useEmailStore } from "@/stores/email-store";
import { EmailFilter } from "@/lib/jmap/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function FiltersPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('filters');
  const tSettings = useTranslations('settings');
  const { selectedFilter, setSelectedFilter } = useFilterStore();
  const { mailboxes } = useEmailStore();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingFilter, setEditingFilter] = useState<EmailFilter | null>(null);

  const handleSelectFilter = (filter: EmailFilter) => {
    setSelectedFilter(filter);
    setEditingFilter(filter);
    setView('form');
  };

  const handleNewFilter = () => {
    setEditingFilter(null);
    setSelectedFilter(null);
    setView('form');
  };

  const handleSaveFilter = () => {
    setView('list');
    setEditingFilter(null);
    setSelectedFilter(null);
  };

  const handleCancelForm = () => {
    setView('list');
    setEditingFilter(null);
    setSelectedFilter(null);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Filter List */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r">
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${params.locale}`)}
            className="w-full justify-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tSettings('back_to_mail')}
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <FilterList
            onSelectFilter={handleSelectFilter}
            onNewFilter={handleNewFilter}
            selectedFilterId={selectedFilter?.id}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6">{t('title')}</h1>
          
          {view === 'form' ? (
            <FilterForm
              filter={editingFilter}
              onSave={handleSaveFilter}
              onCancel={handleCancelForm}
              mailboxes={mailboxes.map(mb => ({ id: mb.id, name: mb.name }))}
            />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg mb-2">{t('select_filter')}</p>
              <p className="text-sm">{t('select_filter_description')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
