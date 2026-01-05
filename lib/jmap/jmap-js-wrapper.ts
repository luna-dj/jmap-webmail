/**
 * Wrapper to integrate jmap-js library with existing JMAPClient
 * 
 * This provides a bridge between the custom JMAPClient and jmap-js
 * data model, allowing us to leverage jmap-js for contacts and other features.
 */

import type { Contact } from './types';
import { JMAPClient } from './client';
import {
  loadJMAPJS,
  initializeJMAPJS,
  getJMAPStore,
  getJMAPContacts,
  isJMAPJSLoaded,
} from './jmap-js-integration';

export class JMAPJSWrapper {
  private client: JMAPClient;
  private initialized: boolean = false;

  constructor(client: JMAPClient) {
    this.client = client;
  }

  /**
   * Initialize jmap-js with the current client's session data
   */
  async initialize(): Promise<void> {
    if (this.initialized && isJMAPJSLoaded()) {
      return;
    }

    // Load jmap-js library
    await loadJMAPJS();

    // Get session data from client
    const session = this.client['session'];
    if (!session) {
      throw new Error('Client not connected. Call connect() first.');
    }

    // Convert session to jmap-js auth format
    // Note: jmap-js expects accessToken, but we use Basic Auth
    // We'll need to adapt the Connection class to use Basic Auth headers
    const authData = {
      username: this.client['username'] || session.username || '',
      accessToken: '', // We'll handle auth via headers in Connection
      accounts: session.accounts || {},
      apiUrl: session.apiUrl,
      downloadUrl: session.downloadUrl,
      uploadUrl: session.uploadUrl,
      eventSourceUrl: session.eventSourceUrl,
    };

    await initializeJMAPJS(authData);
    this.initialized = true;
  }

  /**
   * Get all contacts using jmap-js
   */
  async getContacts(): Promise<Contact[]> {
    await this.initialize();

    const store = getJMAPStore();
    getJMAPContacts();

    // Use jmap-js query to get all contacts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = store.getQuery('allContacts', (window as any).O?.LiveQuery, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Type: (window as any).JMAP?.Contact,
      sort: ['firstName', 'lastName', 'id'],
    });

    // Wait for query to be ready
    return new Promise((resolve) => {
      const checkStatus = () => {
        const status = query.get('status');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (status & (window as any).O?.Status?.READY) {
          const contacts: Contact[] = [];
          const length = query.get('length');
          for (let i = 0; i < length; i++) {
            const contact = query.getObjectAt(i);
            contacts.push(this.mapJMAPJSContactToContact(contact));
          }
          resolve(contacts);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if (status & (window as any).O?.Status?.NON_EXISTENT) {
          resolve([]);
        } else {
          // Still loading, check again
          setTimeout(checkStatus, 100);
        }
      };
      checkStatus();
    });
  }

  /**
   * Get contact by email using jmap-js
   */
  async getContactByEmail(email: string): Promise<Contact | null> {
    await this.initialize();

    const contacts = getJMAPContacts();
    const contact = contacts.getContactFromEmail(email);
    
    if (!contact) {
      return null;
    }

    return this.mapJMAPJSContactToContact(contact);
  }

  /**
   * Create contact using jmap-js
   */
  async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    await this.initialize();

    const editStore = getJMAPContacts().editStore;

    // Get a contact object in the edit store
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jmapContact = editStore.createRecord((window as any).JMAP?.Contact, {
      firstName: contact.firstName,
      lastName: contact.lastName,
      name: contact.name,
      email: contact.email,
      emails: contact.emails,
      phone: contact.phone,
      phones: contact.phones,
      company: contact.company,
      jobTitle: contact.jobTitle,
      address: contact.address,
      notes: contact.notes,
    });

    // Commit changes
    editStore.commitChanges();

    // Wait for the contact to be saved
    return new Promise((resolve, reject) => {
      const checkStatus = () => {
        const status = jmapContact.get('status');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (status & (window as any).O?.Status?.READY) {
          resolve(jmapContact.get('id'));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if (status & (window as any).O?.Status?.NON_EXISTENT) {
          reject(new Error('Failed to create contact'));
        } else {
          setTimeout(checkStatus, 100);
        }
      };
      checkStatus();
    });
  }

  /**
   * Update contact using jmap-js
   */
  async updateContact(contactId: string, updates: Partial<Contact>): Promise<void> {
    await this.initialize();

    const store = getJMAPStore();
    const editStore = getJMAPContacts().editStore;

    // Get the contact in the edit store
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contact = store.getRecord((window as any).JMAP?.Contact, contactId);
    const contactToEdit = contact.getDoppelganger(editStore);

    // Apply updates
    Object.keys(updates).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      contactToEdit.set(key, (updates as any)[key]);
    });

    // Commit changes
    editStore.commitChanges();
  }

  /**
   * Delete contact using jmap-js
   */
  async deleteContact(contactId: string): Promise<void> {
    await this.initialize();

    const editStore = getJMAPContacts().editStore;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contact = editStore.getRecord((window as any).JMAP?.Contact, contactId);
    
    contact.destroy();
    editStore.commitChanges();
  }

  /**
   * Map jmap-js Contact to our Contact type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapJMAPJSContactToContact(jmapContact: any): Contact {
    return {
      id: jmapContact.get('id'),
      firstName: jmapContact.get('firstName'),
      lastName: jmapContact.get('lastName'),
      name: jmapContact.get('name'),
      email: jmapContact.get('email') || '',
      emails: jmapContact.get('emails'),
      phone: jmapContact.get('phone'),
      phones: jmapContact.get('phones'),
      company: jmapContact.get('company'),
      jobTitle: jmapContact.get('jobTitle'),
      address: jmapContact.get('address'),
      notes: jmapContact.get('notes'),
      createdAt: jmapContact.get('createdAt'),
      updatedAt: jmapContact.get('updatedAt'),
    };
  }
}
