"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useContactStore } from "@/stores/contact-store";
import { Contact } from "@/lib/jmap/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactFormProps {
  contact?: Contact | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ContactForm({ contact, onSave, onCancel }: ContactFormProps) {
  const t = useTranslations('contacts');
  const { addContact, updateContact } = useContactStore();

  const [formData, setFormData] = useState({
    firstName: contact?.firstName || '',
    lastName: contact?.lastName || '',
    name: contact?.name || '',
    email: contact?.email || '',
    emails: contact?.emails?.join(', ') || '',
    phone: contact?.phone || '',
    phones: contact?.phones?.join(', ') || '',
    company: contact?.company || '',
    jobTitle: contact?.jobTitle || '',
    street: contact?.address?.street || '',
    city: contact?.address?.city || '',
    state: contact?.address?.state || '',
    postalCode: contact?.address?.postalCode || '',
    country: contact?.address?.country || '',
    notes: contact?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        name: contact.name || '',
        email: contact.email || '',
        emails: contact.emails?.join(', ') || '',
        phone: contact.phone || '',
        phones: contact.phones?.join(', ') || '',
        company: contact.company || '',
        jobTitle: contact.jobTitle || '',
        street: contact.address?.street || '',
        city: contact.address?.city || '',
        state: contact.address?.state || '',
        postalCode: contact.address?.postalCode || '',
        country: contact.address?.country || '',
        notes: contact.notes || '',
      });
    }
  }, [contact]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = t('email_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('email_invalid');
    }

    // Validate additional emails if provided
    if (formData.emails) {
      const emailList = formData.emails.split(',').map(e => e.trim()).filter(Boolean);
      for (const email of emailList) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          newErrors.emails = t('email_invalid');
          break;
        }
      }
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
      const contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> = {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        name: formData.name || (formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : undefined),
        email: formData.email.trim(),
        emails: formData.emails ? formData.emails.split(',').map(e => e.trim()).filter(Boolean) : undefined,
        phone: formData.phone || undefined,
        phones: formData.phones ? formData.phones.split(',').map(p => p.trim()).filter(Boolean) : undefined,
        company: formData.company || undefined,
        jobTitle: formData.jobTitle || undefined,
        address: (formData.street || formData.city || formData.state || formData.postalCode || formData.country) ? {
          street: formData.street || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          postalCode: formData.postalCode || undefined,
          country: formData.country || undefined,
        } : undefined,
        notes: formData.notes || undefined,
      };

      if (contact) {
        await updateContact(contact.id, contactData);
      } else {
        await addContact(contactData);
      }

      onSave();
    } catch (error) {
      console.error('Failed to save contact:', error);
      setErrors({ submit: t('save_error') });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{t('basic_information')}</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('first_name')}</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder={t('first_name_placeholder')}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('last_name')}</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder={t('last_name_placeholder')}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('full_name')} <span className="text-xs">({t('optional')})</span></label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('full_name_placeholder')}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('email')} <span className="text-red-500">*</span></label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('email_placeholder')}
              className={cn(errors.email && "border-red-500")}
              required
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('additional_emails')} <span className="text-xs">({t('optional')})</span></label>
            <Input
              type="text"
              value={formData.emails}
              onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
              placeholder={t('additional_emails_placeholder')}
              className={cn(errors.emails && "border-red-500")}
            />
            {errors.emails && <p className="text-xs text-red-500 mt-1">{errors.emails}</p>}
            <p className="text-xs text-muted-foreground mt-1">{t('comma_separated')}</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{t('contact_information')}</h3>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('phone')}</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t('phone_placeholder')}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('additional_phones')}</label>
            <Input
              type="text"
              value={formData.phones}
              onChange={(e) => setFormData({ ...formData, phones: e.target.value })}
              placeholder={t('additional_phones_placeholder')}
            />
            <p className="text-xs text-muted-foreground mt-1">{t('comma_separated')}</p>
          </div>
        </div>

        {/* Work Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{t('work_information')}</h3>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('company')}</label>
            <Input
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder={t('company_placeholder')}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('job_title')}</label>
            <Input
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder={t('job_title_placeholder')}
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{t('address')}</h3>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">{t('street')}</label>
            <Input
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder={t('street_placeholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('city')}</label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder={t('city_placeholder')}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('state')}</label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder={t('state_placeholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('postal_code')}</label>
              <Input
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder={t('postal_code_placeholder')}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('country')}</label>
              <Input
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder={t('country_placeholder')}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">{t('notes')}</h3>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder={t('notes_placeholder')}
            className="w-full min-h-[100px] p-3 border rounded-md resize-none outline-none text-sm"
            rows={4}
          />
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
