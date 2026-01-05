"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useContactStore } from "@/stores/contact-store";
import { Contact } from "@/lib/jmap/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Search, Plus, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactListProps {
  onSelectContact: (contact: Contact) => void;
  onNewContact: () => void;
  selectedContactId?: string | null;
}

export function ContactList({ onSelectContact, onNewContact, selectedContactId }: ContactListProps) {
  const t = useTranslations('contacts');
  const { searchContacts, searchQuery, setSearchQuery, selectedGroup, setSelectedGroup, groups } = useContactStore();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const filteredContacts = searchContacts(localSearchQuery);

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    setSearchQuery(value);
  };

  const getDisplayName = (contact: Contact) => {
    if (contact.name) return contact.name;
    if (contact.firstName || contact.lastName) {
      return `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
    }
    return contact.email;
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewContact}
            title={t('add_contact')}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('search_placeholder')}
            value={localSearchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Group filter */}
        {groups.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              variant={selectedGroup === null ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedGroup(null)}
              className="text-xs whitespace-nowrap"
            >
              <Users className="w-3 h-3 mr-1" />
              {t('all_contacts')}
            </Button>
            {groups.map((group) => (
              <Button
                key={group.id}
                variant={selectedGroup === group.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedGroup(group.id)}
                className="text-xs whitespace-nowrap"
              >
                {group.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <UserPlus className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {localSearchQuery ? t('no_contacts_found') : t('no_contacts')}
            </p>
            {!localSearchQuery && (
              <Button variant="outline" size="sm" onClick={onNewContact}>
                <Plus className="w-4 h-4 mr-2" />
                {t('add_first_contact')}
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={cn(
                  "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                  selectedContactId === contact.id && "bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={getDisplayName(contact)}
                    email={contact.email}
                    size="md"
                    className="w-10 h-10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{getDisplayName(contact)}</div>
                    <div className="text-sm text-muted-foreground truncate">{contact.email}</div>
                    {contact.company && (
                      <div className="text-xs text-muted-foreground truncate">{contact.company}</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="p-3 border-t text-xs text-muted-foreground text-center">
        {t('contact_count', { count: filteredContacts.length })}
      </div>
    </div>
  );
}
