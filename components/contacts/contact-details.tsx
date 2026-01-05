"use client";

import { useTranslations } from "next-intl";
import { useContactStore } from "@/stores/contact-store";
import { Contact } from "@/lib/jmap/types";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Mail, Phone, Building, MapPin, FileText, Edit, Trash2 } from "lucide-react";

interface ContactDetailsProps {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
}

export function ContactDetails({ contact, onEdit, onDelete }: ContactDetailsProps) {
  const t = useTranslations('contacts');

  const getDisplayName = () => {
    if (contact.name) return contact.name;
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    }
    return contact.email;
  };

  const formatAddress = () => {
    const addr = contact.address;
    if (!addr || (!addr.street && !addr.city && !addr.state && !addr.postalCode && !addr.country)) {
      return null;
    }

    const parts = [
      addr.street,
      [addr.city, addr.state, addr.postalCode].filter(Boolean).join(', '),
      addr.country,
    ].filter(Boolean);

    return parts.join('\n');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-start gap-4">
          <Avatar
            name={getDisplayName()}
            email={contact.email}
            size="lg"
            className="w-16 h-16 text-lg"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-semibold mb-1">{getDisplayName()}</h2>
            {contact.company && (
              <p className="text-sm text-muted-foreground">{contact.company}</p>
            )}
            {contact.jobTitle && (
              <p className="text-sm text-muted-foreground">{contact.jobTitle}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit} title={t('edit')}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} title={t('delete')}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Email Addresses */}
        <div>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            {t('email_addresses')}
          </h3>
          <div className="space-y-2">
            <div className="text-sm">
              <a
                href={`mailto:${contact.email}`}
                className="text-primary hover:underline"
              >
                {contact.email}
              </a>
            </div>
            {contact.emails && contact.emails.length > 0 && (
              <div className="space-y-1">
                {contact.emails.map((email, index) => (
                  <div key={index} className="text-sm">
                    <a
                      href={`mailto:${email}`}
                      className="text-primary hover:underline"
                    >
                      {email}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Phone Numbers */}
        {(contact.phone || (contact.phones && contact.phones.length > 0)) && (
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {t('phone_numbers')}
            </h3>
            <div className="space-y-2">
              {contact.phone && (
                <div className="text-sm">
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-primary hover:underline"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.phones && contact.phones.length > 0 && (
                <div className="space-y-1">
                  {contact.phones.map((phone, index) => (
                    <div key={index} className="text-sm">
                      <a
                        href={`tel:${phone}`}
                        className="text-primary hover:underline"
                      >
                        {phone}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Work Information */}
        {(contact.company || contact.jobTitle) && (
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Building className="w-4 h-4" />
              {t('work_information')}
            </h3>
            <div className="space-y-2 text-sm">
              {contact.company && (
                <div>
                  <span className="text-muted-foreground">{t('company')}: </span>
                  <span>{contact.company}</span>
                </div>
              )}
              {contact.jobTitle && (
                <div>
                  <span className="text-muted-foreground">{t('job_title')}: </span>
                  <span>{contact.jobTitle}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Address */}
        {formatAddress() && (
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t('address')}
            </h3>
            <div className="text-sm whitespace-pre-line">
              {formatAddress()}
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('notes')}
            </h3>
            <div className="text-sm whitespace-pre-line">
              {contact.notes}
            </div>
          </div>
        )}

        {/* Groups */}
        {contact.groups && contact.groups.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3">{t('groups')}</h3>
            <div className="flex flex-wrap gap-2">
              {contact.groups.map((groupId) => {
                const group = useContactStore.getState().getGroup(groupId);
                return group ? (
                  <span
                    key={groupId}
                    className="px-2 py-1 text-xs bg-muted rounded-md"
                  >
                    {group.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
