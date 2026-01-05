"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFilterStore } from "@/stores/filter-store";
import { EmailFilter, FilterCondition, FilterAction } from "@/lib/jmap/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Save } from "lucide-react";

interface FilterFormProps {
  filter?: EmailFilter | null;
  onSave: () => void;
  onCancel: () => void;
  mailboxes?: Array<{ id: string; name: string }>;
}

export function FilterForm({ filter, onSave, onCancel, mailboxes = [] }: FilterFormProps) {
  const t = useTranslations('filters');
  const { addFilter, updateFilter } = useFilterStore();

  const [formData, setFormData] = useState({
    name: filter?.name || '',
    enabled: filter?.enabled !== false,
    conditions: filter?.conditions || [] as FilterCondition[],
    actions: filter?.actions || [] as FilterAction[],
    matchAll: filter?.matchAll !== false,
    stopOnMatch: filter?.stopOnMatch || false,
    priority: filter?.priority || 100,
  });

  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    if (!formData.name.trim()) {
      setError(t('name_required'));
      return;
    }

    if (formData.conditions.length === 0) {
      setError(t('conditions_required'));
      return;
    }

    if (formData.actions.length === 0) {
      setError(t('actions_required'));
      return;
    }

    try {
      if (filter) {
        await updateFilter(filter.id, formData);
      } else {
        await addFilter(formData);
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('save_error'));
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { type: 'from', operator: 'contains', value: '' } as FilterCondition],
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (index: number, updates: Partial<FilterCondition>) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], ...updates } as FilterCondition;
    setFormData({ ...formData, conditions: newConditions });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'markAsRead', read: true } as FilterAction],
    });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  const updateAction = (index: number, updates: Partial<FilterAction>) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], ...updates } as FilterAction;
    setFormData({ ...formData, actions: newActions });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500 rounded-md text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">
            {t('name')} <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('name_placeholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">{t('priority')}</label>
            <Input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('priority_hint')}</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
            />
            <span className="text-sm">{t('enabled')}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.matchAll}
              onChange={(e) => setFormData({ ...formData, matchAll: e.target.checked })}
            />
            <span className="text-sm">{t('match_all')}</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.stopOnMatch}
              onChange={(e) => setFormData({ ...formData, stopOnMatch: e.target.checked })}
            />
            <span className="text-sm">{t('stop_on_match')}</span>
          </label>
        </div>
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{t('conditions')}</h3>
          <Button variant="outline" size="sm" onClick={addCondition}>
            <Plus className="w-4 h-4 mr-2" />
            {t('add_condition')}
          </Button>
        </div>
        <div className="space-y-3">
          {formData.conditions.map((condition, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('condition')} {index + 1}</span>
                <Button variant="ghost" size="icon" onClick={() => removeCondition(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={condition.type}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => updateCondition(index, { type: e.target.value as any })}
                  className="px-3 py-1.5 text-sm border rounded-md"
                >
                  <option value="from">{t('condition_from')}</option>
                  <option value="to">{t('condition_to')}</option>
                  <option value="subject">{t('condition_subject')}</option>
                  <option value="body">{t('condition_body')}</option>
                  <option value="hasAttachment">{t('condition_has_attachment')}</option>
                  <option value="size">{t('condition_size')}</option>
                  <option value="isRead">{t('condition_is_read')}</option>
                  <option value="isStarred">{t('condition_is_starred')}</option>
                </select>
                {condition.type !== 'hasAttachment' && condition.type !== 'isRead' && condition.type !== 'isStarred' && (
                  <select
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value={(condition as any).operator || 'contains'}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onChange={(e) => updateCondition(index, { operator: e.target.value as any })}
                    className="px-3 py-1.5 text-sm border rounded-md"
                  >
                    <option value="contains">{t('operator_contains')}</option>
                    <option value="equals">{t('operator_equals')}</option>
                    <option value="startsWith">{t('operator_starts_with')}</option>
                    <option value="endsWith">{t('operator_ends_with')}</option>
                  </select>
                )}
                <Input
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  value={(condition as any).value || ''}
                  onChange={(e) => updateCondition(index, { value: e.target.value })}
                  placeholder={t('value_placeholder')}
                  type={condition.type === 'size' ? 'number' : condition.type === 'hasAttachment' || condition.type === 'isRead' || condition.type === 'isStarred' ? 'hidden' : 'text'}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">{t('actions')}</h3>
          <Button variant="outline" size="sm" onClick={addAction}>
            <Plus className="w-4 h-4 mr-2" />
            {t('add_action')}
          </Button>
        </div>
        <div className="space-y-3">
          {formData.actions.map((action, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('action')} {index + 1}</span>
                <Button variant="ghost" size="icon" onClick={() => removeAction(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={action.type}
                  onChange={(e) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const newAction: FilterAction = { type: e.target.value as any } as FilterAction;
                    if (e.target.value === 'moveToMailbox') {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (newAction as any).mailboxId = mailboxes[0]?.id || '';
                    } else if (e.target.value === 'markAsRead') {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (newAction as any).read = true;
                    } else if (e.target.value === 'star') {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (newAction as any).starred = true;
                    } else if (e.target.value === 'forward') {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (newAction as any).to = [];
                    }
                    updateAction(index, newAction);
                  }}
                  className="px-3 py-1.5 text-sm border rounded-md"
                >
                  <option value="moveToMailbox">{t('action_move')}</option>
                  <option value="markAsRead">{t('action_mark_read')}</option>
                  <option value="star">{t('action_star')}</option>
                  <option value="delete">{t('action_delete')}</option>
                </select>
                {action.type === 'moveToMailbox' && (
                  <select
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value={(action as any).mailboxId || ''}
                    onChange={(e) => updateAction(index, { mailboxId: e.target.value })}
                    className="px-3 py-1.5 text-sm border rounded-md"
                  >
                    {mailboxes.map((mb) => (
                      <option key={mb.id} value={mb.id}>{mb.name}</option>
                    ))}
                  </select>
                )}
                {action.type === 'markAsRead' && (
                  <select
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value={(action as any).read ? 'true' : 'false'}
                    onChange={(e) => updateAction(index, { read: e.target.value === 'true' })}
                    className="px-3 py-1.5 text-sm border rounded-md"
                  >
                    <option value="true">{t('read')}</option>
                    <option value="false">{t('unread')}</option>
                  </select>
                )}
                {action.type === 'star' && (
                  <select
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value={(action as any).starred ? 'true' : 'false'}
                    onChange={(e) => updateAction(index, { starred: e.target.value === 'true' })}
                    className="px-3 py-1.5 text-sm border rounded-md"
                  >
                    <option value="true">{t('starred')}</option>
                    <option value="false">{t('unstarred')}</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleSave} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          {t('save')}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t('cancel')}
        </Button>
      </div>
    </div>
  );
}
