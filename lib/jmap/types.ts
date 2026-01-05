export interface EmailHeader {
  name: string;
  value: string;
}

export interface Email {
  id: string;
  threadId: string;
  mailboxIds: Record<string, boolean>;
  keywords: Record<string, boolean>;
  size: number;
  receivedAt: string;
  from?: EmailAddress[];
  to?: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress[];
  subject?: string;
  sentAt?: string;
  preview?: string;
  textBody?: EmailBodyPart[];
  htmlBody?: EmailBodyPart[];
  bodyValues?: Record<string, EmailBodyValue>;
  attachments?: Attachment[];
  hasAttachment: boolean;
  // Extended header information
  messageId?: string;
  inReplyTo?: string[];
  references?: string[];
  headers?: Record<string, string | string[]>;
  // Security headers parsed
  authenticationResults?: AuthenticationResults;
  spamScore?: number;
  spamStatus?: string;
  spamLLM?: {
    verdict: string;
    explanation: string;
  };
}

export interface AuthenticationResults {
  spf?: {
    result: 'pass' | 'fail' | 'softfail' | 'neutral' | 'none' | 'temperror' | 'permerror';
    domain?: string;
    ip?: string;
  };
  dkim?: {
    result: 'pass' | 'fail' | 'policy' | 'neutral' | 'temperror' | 'permerror';
    domain?: string;
    selector?: string;
  };
  dmarc?: {
    result: 'pass' | 'fail' | 'none';
    policy?: 'reject' | 'quarantine' | 'none';
    domain?: string;
  };
  iprev?: {
    result: 'pass' | 'fail';
    ip?: string;
  };
}

export interface EmailBodyValue {
  value: string;
  isEncodingProblem?: boolean;
  isTruncated?: boolean;
}

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailBodyPart {
  partId: string;
  blobId: string;
  size: number;
  name?: string;
  type: string;
  charset?: string;
  disposition?: string;
  cid?: string;
  language?: string[];
  location?: string;
  subParts?: EmailBodyPart[];
}

export interface Attachment {
  partId: string;
  blobId: string;
  size: number;
  name?: string;
  type: string;
  charset?: string;
  cid?: string;
  disposition?: string;
}

export interface Mailbox {
  id: string;
  originalId?: string; // Original JMAP ID (for shared mailboxes)
  name: string;
  parentId?: string;
  role?: string;
  sortOrder: number;
  totalEmails: number;
  unreadEmails: number;
  totalThreads: number;
  unreadThreads: number;
  myRights: {
    mayReadItems: boolean;
    mayAddItems: boolean;
    mayRemoveItems: boolean;
    maySetSeen: boolean;
    maySetKeywords: boolean;
    mayCreateChild: boolean;
    mayRename: boolean;
    mayDelete: boolean;
    maySubmit: boolean;
  };
  isSubscribed: boolean;
  // Shared folder support
  accountId?: string;
  accountName?: string;
  isShared?: boolean;
}

export interface Thread {
  id: string;
  emailIds: string[];
}

// Thread grouping for UI display
export interface ThreadGroup {
  threadId: string;
  emails: Email[];           // Emails in this thread (sorted by receivedAt desc)
  latestEmail: Email;        // Most recent email
  participantNames: string[];// Unique participant names
  hasUnread: boolean;        // Any unread emails in thread
  hasStarred: boolean;       // Any starred emails in thread
  hasAttachment: boolean;    // Any email has attachment
  emailCount: number;        // Total emails in thread
}

export interface Identity {
  id: string;
  name: string;
  email: string;
  replyTo?: EmailAddress[];
  bcc?: EmailAddress[];
  textSignature?: string;
  htmlSignature?: string;
  mayDelete: boolean;
}

export interface EmailSubmission {
  id: string;
  identityId: string;
  emailId: string;
  threadId?: string;
  envelope: {
    mailFrom: EmailAddress;
    rcptTo: EmailAddress[];
  };
  sendAt?: string;
  undoStatus: "pending" | "final" | "canceled";
  deliveryStatus?: Record<string, DeliveryStatus>;
  dsnBlobIds?: string[];
  mdnBlobIds?: string[];
}

export interface DeliveryStatus {
  smtpReply: string;
  delivered: "queued" | "yes" | "no" | "unknown";
  displayed: "unknown" | "yes";
}

// JMAP Push Notification Types (RFC 8620 Section 7)

export interface StateChange {
  '@type': 'StateChange';
  changed: {
    [accountId: string]: {
      Email?: string;
      Mailbox?: string;
      Thread?: string;
      EmailDelivery?: string;
      EmailSubmission?: string;
      Identity?: string;
    };
  };
}

export interface PushSubscription {
  id: string;
  deviceClientId: string;
  url: string;
  keys: {
    p256dh: string;
    auth: string;
  } | null;
  expires: string | null;
  types: string[] | null;
}

// For tracking last known states
export interface AccountStates {
  [accountId: string]: {
    Email?: string;
    Mailbox?: string;
    Thread?: string;
  };
}

// Contact/Address Book Types
export interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Full name (for backwards compatibility)
  email: string;
  emails?: string[]; // Multiple email addresses
  phone?: string;
  phones?: string[]; // Multiple phone numbers
  company?: string;
  jobTitle?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  notes?: string;
  groups?: string[]; // Contact groups
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  contactIds: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Email Template Types
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables?: string[]; // e.g., ["name", "company"] for {{name}} and {{company}} placeholders
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Calendar Types (JMAP Calendars)
export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color?: string;
  timeZone?: string;
  isReadOnly?: boolean;
  sortOrder?: number;
  accountId?: string;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  start: string; // ISO 8601 date-time
  end: string; // ISO 8601 date-time
  allDay?: boolean;
  location?: string;
  attendees?: Array<{
    email: string;
    name?: string;
    role?: 'organizer' | 'required' | 'optional';
    status?: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }>;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    count?: number;
    until?: string;
    byDay?: string[];
    byMonth?: string[];
    byMonthDay?: number[];
  };
  reminders?: Array<{
    method: 'email' | 'display' | 'sound';
    minutes: number;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

// Signature Types
export interface EmailSignature {
  id: string;
  name: string;
  text?: string;
  html?: string;
  isDefault?: boolean;
  identityId?: string; // Link to JMAP identity if applicable
  createdAt?: string;
  updatedAt?: string;
}

// Vacation Responder Types
export interface VacationResponder {
  id: string;
  enabled: boolean;
  subject?: string;
  textBody?: string;
  htmlBody?: string;
  fromDate?: string; // ISO 8601 date
  toDate?: string; // ISO 8601 date
  identityId?: string; // Link to JMAP identity
  createdAt?: string;
  updatedAt?: string;
}

// Email Alias Types
export interface EmailAlias {
  id: string;
  email: string;
  name?: string;
  description?: string;
  isDefault?: boolean;
  identityId?: string; // Link to JMAP identity if applicable
  createdAt?: string;
  updatedAt?: string;
}

// Email Filter and Rule Types
export type FilterCondition = 
  | { type: 'from'; operator: 'contains' | 'equals' | 'startsWith' | 'endsWith'; value: string }
  | { type: 'to'; operator: 'contains' | 'equals' | 'startsWith' | 'endsWith'; value: string }
  | { type: 'subject'; operator: 'contains' | 'equals' | 'startsWith' | 'endsWith'; value: string }
  | { type: 'body'; operator: 'contains' | 'equals' | 'startsWith' | 'endsWith'; value: string }
  | { type: 'hasAttachment'; value: boolean }
  | { type: 'size'; operator: 'greaterThan' | 'lessThan' | 'equals'; value: number }
  | { type: 'date'; operator: 'before' | 'after' | 'equals'; value: string } // ISO 8601 date
  | { type: 'isRead'; value: boolean }
  | { type: 'isStarred'; value: boolean };

export type FilterAction =
  | { type: 'moveToMailbox'; mailboxId: string }
  | { type: 'markAsRead'; read: boolean }
  | { type: 'star'; starred: boolean }
  | { type: 'delete' }
  | { type: 'forward'; to: string[] }
  | { type: 'addLabel'; label: string }
  | { type: 'removeLabel'; label: string };

export interface EmailFilter {
  id: string;
  name: string;
  enabled: boolean;
  conditions: FilterCondition[];
  actions: FilterAction[];
  matchAll?: boolean; // If true, all conditions must match (AND). If false, any condition matches (OR)
  stopOnMatch?: boolean; // If true, stop processing other filters after this one matches
  priority?: number; // Lower numbers = higher priority
  createdAt?: string;
  updatedAt?: string;
}

// Advanced Search Filter Types
export interface SearchFilter {
  text?: string;
  from?: string[];
  to?: string[];
  subject?: string;
  hasAttachment?: boolean;
  isRead?: boolean;
  isStarred?: boolean;
  dateFrom?: string; // ISO 8601 date
  dateTo?: string; // ISO 8601 date
  mailboxIds?: string[];
  sizeMin?: number; // bytes
  sizeMax?: number; // bytes
}

// PGP/GPG Encryption Types
export interface PGPKey {
  id: string;
  fingerprint: string;
  email: string;
  name?: string;
  publicKey: string;
  privateKey?: string; // Encrypted private key
  isOwnKey: boolean;
  createdAt?: string;
  expiresAt?: string;
}

export interface EncryptedEmail {
  encryptedBody: string;
  encryptedSubject?: string;
  keyIds: string[]; // PGP key IDs used for encryption
  signature?: string; // Digital signature
}