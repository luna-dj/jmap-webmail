"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSignatureStore } from "@/stores/signature-store";
import { EmailSignature } from "@/lib/jmap/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsSection } from "./settings-section";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SignatureSettings() {
  const t = useTranslations('settings.signatures');
  const { signatures, addSignature, updateSignature, deleteSignature, setDefaultSignature } = useSignatureStore();
  const [editingSignature, setEditingSignature] = useState<EmailSignature | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    html: '',
    isDefault: false,
  });

  const handleNewSignature = () => {
    setEditingSignature(null);
    setFormData({ name: '', text: '', html: '', isDefault: false });
    setShowForm(true);
  };

  const handleEditSignature = (signature: EmailSignature) => {
    setEditingSignature(signature);
    setFormData({
      name: signature.name,
      text: signature.text || '',
      html: signature.html || '',
      isDefault: signature.isDefault || false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert(t('name_required'));
      return;
    }

    try {
      if (editingSignature) {
        await updateSignature(editingSignature.id, formData);
      } else {
        await addSignature(formData);
      }
      setShowForm(false);
      setEditingSignature(null);
      setFormData({ name: '', text: '', html: '', isDefault: false });
    } catch (error) {
      console.error('Failed to save signature:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSignature(null);
    setFormData({ name: '', text: '', html: '', isDefault: false });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('delete_confirm'))) {
      await deleteSignature(id);
    }
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultSignature(id);
  };

  return (
    <SettingsSection title={t('title')} description={t('description')}>
      {!showForm ? (
        <>
          <div className="mb-4">
            <Button onClick={handleNewSignature} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('add_signature')}
            </Button>
          </div>

          {signatures.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('no_signatures')}</p>
          ) : (
            <div className="space-y-3">
              {signatures.map((signature) => (
                <div
                  key={signature.id}
                  className={cn(
                    "p-4 border rounded-lg",
                    signature.isDefault && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{signature.name}</h4>
                        {signature.isDefault && (
                          <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded">
                            {t('default')}
                          </span>
                        )}
                      </div>
                      {signature.text && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {signature.text}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditSignature(signature)}
                        title={t('edit')}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!signature.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSetDefault(signature.id)}
                          title={t('set_default')}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(signature.id)}
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

          <div>
            <label className="text-sm font-medium mb-1 block">{t('text_signature')}</label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder={t('text_signature_placeholder')}
              className="w-full min-h-[100px] p-3 border rounded-md resize-none outline-none text-sm"
              rows={5}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{t('html_signature')}</label>
            <textarea
              value={formData.html}
              onChange={(e) => setFormData({ ...formData, html: e.target.value })}
              placeholder={t('html_signature_placeholder')}
              className="w-full min-h-[100px] p-3 border rounded-md resize-none outline-none text-sm font-mono"
              rows={5}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('html_signature_hint')}</p>
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
