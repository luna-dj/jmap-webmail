"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAliasStore } from "@/stores/alias-store";
import { EmailAlias } from "@/lib/jmap/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsSection } from "./settings-section";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AliasSettings() {
  const t = useTranslations('settings.aliases');
  const { aliases, addAlias, updateAlias, deleteAlias, setDefaultAlias } = useAliasStore();
  const [editingAlias, setEditingAlias] = useState<EmailAlias | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    description: '',
    isDefault: false,
  });
  const [error, setError] = useState<string | null>(null);

  const handleNewAlias = () => {
    setEditingAlias(null);
    setFormData({ email: '', name: '', description: '', isDefault: false });
    setError(null);
    setShowForm(true);
  };

  const handleEditAlias = (alias: EmailAlias) => {
    setEditingAlias(alias);
    setFormData({
      email: alias.email,
      name: alias.name || '',
      description: alias.description || '',
      isDefault: alias.isDefault || false,
    });
    setError(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    setError(null);

    if (!formData.email.trim()) {
      setError(t('email_required'));
      return;
    }

    try {
      if (editingAlias) {
        await updateAlias(editingAlias.id, formData);
      } else {
        await addAlias(formData);
      }
      setShowForm(false);
      setEditingAlias(null);
      setFormData({ email: '', name: '', description: '', isDefault: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('save_error'));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAlias(null);
    setFormData({ email: '', name: '', description: '', isDefault: false });
    setError(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('delete_confirm'))) {
      try {
        await deleteAlias(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : t('delete_error'));
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAlias(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('set_default_error'));
    }
  };

  return (
    <SettingsSection title={t('title')} description={t('description')}>
      {!showForm ? (
        <>
          <div className="mb-4">
            <Button onClick={handleNewAlias} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('add_alias')}
            </Button>
          </div>

          {aliases.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('no_aliases')}</p>
          ) : (
            <div className="space-y-3">
              {aliases.map((alias) => (
                <div
                  key={alias.id}
                  className={cn(
                    "p-4 border rounded-lg",
                    alias.isDefault && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{alias.email}</h4>
                        {alias.isDefault && (
                          <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded">
                            {t('default')}
                          </span>
                        )}
                      </div>
                      {alias.name && (
                        <p className="text-sm text-muted-foreground mt-1">{alias.name}</p>
                      )}
                      {alias.description && (
                        <p className="text-xs text-muted-foreground mt-1">{alias.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditAlias(alias)}
                        title={t('edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!alias.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetDefault(alias.id)}
                          title={t('set_default')}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(alias.id)}
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
        </>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded-md text-sm text-red-500">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1 block">
              {t('email')} <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('email_placeholder')}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{t('name')}</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('name_placeholder')}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('name_hint')}</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{t('description')}</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('description_placeholder')}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('description_hint')}</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            />
            <label htmlFor="isDefault" className="text-sm">
              {t('set_as_default')}
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave}>
              <Check className="w-4 h-4 mr-2" />
              {t('save')}
            </Button>
            <Button variant="ghost" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
