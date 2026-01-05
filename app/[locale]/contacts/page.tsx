"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ContactList } from "@/components/contacts/contact-list";
import { ContactDetails } from "@/components/contacts/contact-details";
import { ContactForm } from "@/components/contacts/contact-form";
import { useContactStore } from "@/stores/contact-store";
import { useAuthStore } from "@/stores/auth-store";
import { Contact } from "@/lib/jmap/types";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ContactsPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('contacts');
  const tSettings = useTranslations('settings');
  const { client } = useAuthStore();
  const { selectedContact, setSelectedContact, deleteContact, fetchContacts } = useContactStore();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Fetch contacts when page loads
  useEffect(() => {
    if (client) {
      fetchContacts(client);
    }
  }, [client, fetchContacts]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setView('list');
  };

  const handleNewContact = () => {
    setEditingContact(null);
    setView('form');
  };

  const handleEditContact = () => {
    if (selectedContact) {
      setEditingContact(selectedContact);
      setView('form');
    }
  };

  const handleDeleteContact = async () => {
    if (selectedContact && window.confirm(t('delete_confirm', { name: selectedContact.name || selectedContact.email }))) {
      await deleteContact(selectedContact.id);
      setSelectedContact(null);
    }
  };

  const handleSaveContact = () => {
    setView('list');
    setEditingContact(null);
    setSelectedContact(null);
  };

  const handleCancelForm = () => {
    setView('list');
    setEditingContact(null);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Contact List */}
      <div className="w-80 flex-shrink-0 flex flex-col">
        {/* Header with Back button */}
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
          <ContactList
          onSelectContact={handleSelectContact}
          onNewContact={handleNewContact}
          selectedContactId={selectedContact?.id}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {view === 'form' ? (
          <div className="flex-1">
            <ContactForm
              contact={editingContact}
              onSave={handleSaveContact}
              onCancel={handleCancelForm}
            />
          </div>
        ) : selectedContact ? (
          <div className="flex-1">
            <ContactDetails
              contact={selectedContact}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">{t('select_contact')}</p>
              <p className="text-sm">{t('select_contact_description')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
