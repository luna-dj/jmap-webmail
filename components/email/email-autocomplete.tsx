"use client";

 
import { useContactStore } from "@/stores/contact-store";
import { Mail } from "lucide-react";

interface EmailAutocompleteProps {
  query: string;
  onSelect: (email: string) => void;
  show: boolean;
}

export function EmailAutocomplete({ query, onSelect, show }: EmailAutocompleteProps) {
  const { getContactsForAutocomplete } = useContactStore();
  const suggestions = getContactsForAutocomplete(query);

  if (!show || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
      {suggestions.map((contact, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(contact.email)}
          className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-3"
        >
          <Mail className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{contact.name}</div>
            <div className="text-sm text-muted-foreground truncate">{contact.email}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
