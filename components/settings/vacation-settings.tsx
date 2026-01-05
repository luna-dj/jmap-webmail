"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useVacationStore } from "@/stores/vacation-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SettingsSection, SettingItem, ToggleSwitch } from "./settings-section";
import { Save } from "lucide-react";

export function VacationSettings() {
  const t = useTranslations('settings.vacation');
  const { vacationResponders, addVacationResponder, updateVacationResponder, getActiveVacationResponder } = useVacationStore();
  const [formData, setFormData] = useState({
    enabled: false,
    subject: '',
    textBody: '',
    htmlBody: '',
    fromDate: '',
    toDate: '',
  });

  // Get or create vacation responder
  const responder = vacationResponders[0] || null;
  const activeResponder = getActiveVacationResponder();

  useEffect(() => {
    if (responder) {
      setFormData({
        enabled: responder.enabled || false,
        subject: responder.subject || '',
        textBody: responder.textBody || '',
        htmlBody: responder.htmlBody || '',
        fromDate: responder.fromDate ? new Date(responder.fromDate).toISOString().split('T')[0] : '',
        toDate: responder.toDate ? new Date(responder.toDate).toISOString().split('T')[0] : '',
      });
    }
  }, [responder]);

  const handleSave = async () => {
    try {
      if (responder) {
        await updateVacationResponder(responder.id, {
          enabled: formData.enabled,
          subject: formData.subject.trim() || undefined,
          textBody: formData.textBody.trim() || undefined,
          htmlBody: formData.htmlBody.trim() || undefined,
          fromDate: formData.fromDate ? new Date(formData.fromDate).toISOString() : undefined,
          toDate: formData.toDate ? new Date(formData.toDate).toISOString() : undefined,
        });
      } else {
        await addVacationResponder({
          enabled: formData.enabled,
          subject: formData.subject.trim() || undefined,
          textBody: formData.textBody.trim() || undefined,
          htmlBody: formData.htmlBody.trim() || undefined,
          fromDate: formData.fromDate ? new Date(formData.fromDate).toISOString() : undefined,
          toDate: formData.toDate ? new Date(formData.toDate).toISOString() : undefined,
        });
      }
      alert(t('saved_success'));
    } catch (error) {
      console.error('Failed to save vacation responder:', error);
      alert(t('save_error'));
    }
  };

  return (
    <SettingsSection title={t('title')} description={t('description')}>
      {activeResponder && activeResponder.enabled && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary rounded-md">
          <p className="text-sm font-medium text-primary">{t('active_notice')}</p>
        </div>
      )}

      <SettingItem label={t('enabled')} description={t('enabled_description')}>
        <ToggleSwitch
          checked={formData.enabled}
          onChange={(checked) => setFormData({ ...formData, enabled: checked })}
        />
      </SettingItem>

      {formData.enabled && (
        <>
          <div>
            <label className="text-sm font-medium mb-1 block">{t('subject')}</label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder={t('subject_placeholder')}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{t('text_message')}</label>
            <textarea
              value={formData.textBody}
              onChange={(e) => setFormData({ ...formData, textBody: e.target.value })}
              placeholder={t('text_message_placeholder')}
              className="w-full min-h-[150px] p-3 border rounded-md resize-none outline-none text-sm"
              rows={6}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{t('html_message')}</label>
            <textarea
              value={formData.htmlBody}
              onChange={(e) => setFormData({ ...formData, htmlBody: e.target.value })}
              placeholder={t('html_message_placeholder')}
              className="w-full min-h-[150px] p-3 border rounded-md resize-none outline-none text-sm font-mono"
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('html_message_hint')}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{t('from_date')}</label>
              <Input
                type="date"
                value={formData.fromDate}
                onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">{t('from_date_hint')}</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{t('to_date')}</label>
              <Input
                type="date"
                value={formData.toDate}
                onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">{t('to_date_hint')}</p>
            </div>
          </div>
        </>
      )}

      <div className="mt-6">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          {t('save')}
        </Button>
      </div>
    </SettingsSection>
  );
}
