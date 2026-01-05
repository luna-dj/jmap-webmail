import type { Email, Mailbox, StateChange, AccountStates, Thread, Identity, Contact, Calendar, CalendarEvent } from "./types";

// JMAP protocol types - these are intentionally flexible due to server variations
interface JMAPSession {
  apiUrl: string;
  downloadUrl: string;
  uploadUrl?: string;
  eventSourceUrl?: string;
  primaryAccounts?: Record<string, string>;
  accounts?: Record<string, JMAPAccount>;
  capabilities?: Record<string, unknown>;
  username?: string;
  state?: string;
}

interface JMAPAccount {
  name?: string;
  isPersonal?: boolean;
  isReadOnly?: boolean;
  accountCapabilities?: Record<string, unknown>;
}

interface JMAPQuota {
  resourceType?: string;
  scope?: string;
  used?: number;
  hardLimit?: number;
  limit?: number;
}

interface JMAPMailbox {
  id: string;
  name: string;
  parentId?: string | null;
  role?: string | null;
  totalEmails?: number;
  unreadEmails?: number;
  totalThreads?: number;
  unreadThreads?: number;
  sortOrder?: number;
  isSubscribed?: boolean;
  myRights?: Record<string, boolean>;
}

interface JMAPEmailHeader {
  name: string;
  value: string;
}

// Generic JMAP method call type
type JMAPMethodCall = [string, Record<string, unknown>, string];

// JMAP response types - using flexible types due to protocol variations
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JMAPResponseResult = Record<string, any>;

interface JMAPResponse {
  methodResponses: Array<[string, JMAPResponseResult, string]>;
}

export class JMAPClient {
  private serverUrl: string;
  private username: string;
  private password: string;
  private authHeader: string;
  private apiUrl: string = "";
  private accountId: string = "";
  private downloadUrl: string = "";
  private capabilities: Record<string, unknown> = {};
  private session: JMAPSession | null = null;
  private lastPingTime: number = 0;
  private pingInterval: NodeJS.Timeout | null = null;
  private accounts: Record<string, JMAPAccount> = {}; // All accounts (primary + shared)
  private eventSource: EventSource | null = null;
  private stateChangeCallback: ((change: StateChange) => void) | null = null;
  private lastStates: AccountStates = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private jmapJSWrapper: any = null; // Lazy-loaded jmap-js wrapper

  constructor(serverUrl: string, username: string, password: string) {
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.username = username;
    this.password = password;
    this.authHeader = `Basic ${btoa(`${username}:${password}`)}`;
  }

  async connect(): Promise<void> {
    // Get the session first
    const sessionUrl = `${this.serverUrl}/.well-known/jmap`;

    try {
      const sessionResponse = await fetch(sessionUrl, {
        method: 'GET',
        headers: {
          'Authorization': this.authHeader,
        },
      });

      if (!sessionResponse.ok) {
        if (sessionResponse.status === 401) {
          throw new Error('Invalid username or password');
        }
        throw new Error(`Failed to get session: ${sessionResponse.status}`);
      }

      const session = await sessionResponse.json();

      // Store the full session for reference
      this.session = session;

      // Extract and store capabilities
      this.capabilities = session.capabilities || {};

      // Extract the API URL
      this.apiUrl = session.apiUrl;

      // Extract the download URL
      this.downloadUrl = session.downloadUrl;

      // Extract and store all accounts (primary + shared)
      this.accounts = session.accounts || {};

      // Extract the primary account ID
      const mailAccount = session.primaryAccounts?.["urn:ietf:params:jmap:mail"];
      if (mailAccount) {
        this.accountId = mailAccount;
      } else {
        // Try to find any account
        if (this.accounts && Object.keys(this.accounts).length > 0) {
          this.accountId = Object.keys(this.accounts)[0];
        } else {
          throw new Error('No mail account found in session');
        }
      }

      // Start keep-alive mechanism
      this.startKeepAlive();

      // Log contact support status for debugging
      if (this.supportsAddressBook()) {
        const standard = this.getContactStandard();
        if (standard === 'contacts') {
          console.log('✓ JMAP for Contacts (RFC 9610) is supported by server (Stalwart)');
          // Log capability details to help debug
          const contactsCapability = this.capabilities["urn:ietf:params:jmap:contacts"];
          if (contactsCapability) {
            console.log('  Contacts capability details:', JSON.stringify(contactsCapability, null, 2));
          }
        } else {
          console.log('✓ JMAP AddressBook (RFC 8621) is supported by server');
        }
        const contactAccountId = this.getContactAccountId();
        if (contactAccountId) {
          console.log(`  Contact Account ID: ${contactAccountId}`);
        }
      } else {
        console.log('⚠ JMAP Contacts/AddressBook is NOT supported by server - contacts will be stored locally only');
      }

      // Log calendar support status for debugging
      if (this.supportsCalendars()) {
        console.log('✓ JMAP Calendars (JSCalendar - RFC 8984) is supported by server');
        const calendarAccountId = this.getCalendarAccountId();
        if (calendarAccountId) {
          console.log(`  Calendar Account ID: ${calendarAccountId}`);
        }
        const calendarsCapability = this.capabilities["urn:ietf:params:jmap:calendars"];
        if (calendarsCapability) {
          console.log('  Calendars capability details:', JSON.stringify(calendarsCapability, null, 2));
        }
      } else {
        console.log('⚠ JMAP Calendars is NOT supported by server - calendars will be stored locally only');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }

  private startKeepAlive(): void {
    // Stop any existing interval
    this.stopKeepAlive();

    // Ping every 30 seconds to keep the connection alive
    const PING_INTERVAL = 30000; // 30 seconds

    this.pingInterval = setInterval(async () => {
      try {
        await this.ping();
      } catch (error) {
        console.error('Keep-alive ping failed:', error);
        // If ping fails, try to reconnect
        try {
          await this.reconnect();
        } catch (reconnectError) {
          console.error('Reconnection failed:', reconnectError);
        }
      }
    }, PING_INTERVAL);
  }

  private stopKeepAlive(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  async ping(): Promise<void> {
    if (!this.apiUrl) {
      throw new Error('Not connected');
    }

    const now = Date.now();

    // Use Echo method for lightweight ping
    const response = await this.request([
      ["Core/echo", { ping: "pong" }, "0"]
    ]);

    if (response.methodResponses?.[0]?.[0] === "Core/echo") {
      this.lastPingTime = now;
    } else {
      throw new Error('Ping failed');
    }
  }

  async reconnect(): Promise<void> {
    await this.connect();
  }

  disconnect(): void {
    this.stopKeepAlive();
    this.closePushNotifications();
    this.apiUrl = "";
    this.accountId = "";
    this.session = null;
    this.capabilities = {};
  }

  private async request(methodCalls: JMAPMethodCall[], capabilities?: string[]): Promise<JMAPResponse> {
    if (!this.apiUrl) {
      throw new Error('Not connected. Call connect() first.');
    }

    const defaultCapabilities = ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:mail"];
    const requestBody = {
      using: capabilities || defaultCapabilities,
      methodCalls: methodCalls,
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Request failed:', response.status, responseText);
      throw new Error(`Request failed: ${response.status} - ${responseText.substring(0, 200)}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse response:', responseText);
      throw new Error('Invalid JSON response from server');
    }

    return data;
  }

  async getQuota(): Promise<{ used: number; total: number } | null> {
    try {
      const response = await this.request([
        ["Quota/get", {
          accountId: this.accountId,
        }, "0"]
      ]);

      if (response.methodResponses?.[0]?.[0] === "Quota/get") {
        const quotas = (response.methodResponses[0][1].list || []) as JMAPQuota[];
        // Find the mail quota if it exists
        const mailQuota = quotas.find((q) => q.resourceType === "mail" || q.scope === "mail");

        if (mailQuota) {
          return {
            used: mailQuota.used ?? 0,
            total: mailQuota.hardLimit ?? mailQuota.limit ?? 0
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  async getMailboxes(): Promise<Mailbox[]> {
    try {
      const response = await this.request([
        ["Mailbox/get", {
          accountId: this.accountId,
        }, "0"]
      ]);

      if (response.methodResponses?.[0]?.[0] === "Mailbox/get") {
        const rawMailboxes = (response.methodResponses[0][1].list || []) as JMAPMailbox[];

        // Map and ensure all required fields are present
        const mailboxes = rawMailboxes.map((mb) => {
          return {
            id: mb.id,
            originalId: undefined, // Primary account uses original IDs
            name: mb.name,
            parentId: mb.parentId || undefined,
            role: mb.role || undefined,
            sortOrder: mb.sortOrder ?? 0,
            totalEmails: mb.totalEmails ?? 0,
            unreadEmails: mb.unreadEmails ?? 0,
            totalThreads: mb.totalThreads ?? 0,
            unreadThreads: mb.unreadThreads ?? 0,
            myRights: mb.myRights || {
              mayReadItems: true,
              mayAddItems: true,
              mayRemoveItems: true,
              maySetSeen: true,
              maySetKeywords: true,
              mayCreateChild: true,
              mayRename: true,
              mayDelete: true,
              maySubmit: true,
            },
            isSubscribed: mb.isSubscribed ?? true,
            // Account info for primary account
            accountId: this.accountId,
            accountName: this.accounts[this.accountId]?.name || this.username,
            isShared: false,
          } as Mailbox;
        });

        return mailboxes;
      }

      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Failed to get mailboxes:', error);
      // Return default inbox with all required fields
      return [{
        id: 'INBOX',
        originalId: undefined,
        name: 'Inbox',
        role: 'inbox',
        sortOrder: 0,
        totalEmails: 0,
        unreadEmails: 0,
        totalThreads: 0,
        unreadThreads: 0,
        myRights: {
          mayReadItems: true,
          mayAddItems: true,
          mayRemoveItems: true,
          maySetSeen: true,
          maySetKeywords: true,
          mayCreateChild: true,
          mayRename: true,
          mayDelete: true,
          maySubmit: true,
        },
        isSubscribed: true,
        accountId: this.accountId,
        accountName: this.username,
        isShared: false,
      }] as Mailbox[];
    }
  }

  async getAllMailboxes(): Promise<Mailbox[]> {
    try {
      const allMailboxes: Mailbox[] = [];

      // Get all account IDs
      const accountIds = Object.keys(this.accounts);

      // If no accounts, fallback to primary only
      if (accountIds.length === 0) {
        return this.getMailboxes();
      }

      // Fetch mailboxes for each account
      for (const accountId of accountIds) {
        const account = this.accounts[accountId];
        const isPrimary = accountId === this.accountId;

        try {
          const response = await this.request([
            ["Mailbox/get", {
              accountId: accountId,
            }, "0"]
          ]);

          if (response.methodResponses?.[0]?.[0] === "Mailbox/get") {
            const rawMailboxes = (response.methodResponses[0][1].list || []) as JMAPMailbox[];

            // Map mailboxes with account info
            const mailboxes = rawMailboxes.map((mb) => {
              return {
                id: isPrimary ? mb.id : `${accountId}:${mb.id}`, // Namespace shared mailbox IDs
                originalId: mb.id, // Keep original ID for JMAP queries
                name: mb.name,
                parentId: mb.parentId ? (isPrimary ? mb.parentId : `${accountId}:${mb.parentId}`) : undefined,
                role: mb.role || undefined,
                sortOrder: mb.sortOrder ?? 0,
                totalEmails: mb.totalEmails ?? 0,
                unreadEmails: mb.unreadEmails ?? 0,
                totalThreads: mb.totalThreads ?? 0,
                unreadThreads: mb.unreadThreads ?? 0,
                myRights: mb.myRights || {
                  mayReadItems: true,
                  mayAddItems: true,
                  mayRemoveItems: true,
                  maySetSeen: true,
                  maySetKeywords: true,
                  mayCreateChild: true,
                  mayRename: true,
                  mayDelete: true,
                  maySubmit: true,
                },
                isSubscribed: mb.isSubscribed ?? true,
                // Account info
                accountId: accountId,
                accountName: account?.name || (isPrimary ? this.username : accountId),
                isShared: !isPrimary,
              } as Mailbox;
            });

            allMailboxes.push(...mailboxes);
          }
        } catch (error) {
          console.error(`Failed to fetch mailboxes for account ${accountId}:`, error);
          // Continue with other accounts even if one fails
        }
      }

      return allMailboxes;
    } catch (error) {
      console.error("Failed to fetch all mailboxes:", error);
      // Fallback to primary account mailboxes
      return this.getMailboxes();
    }
  }

  async getIdentities(): Promise<Identity[]> {
    try {
      const response = await this.request([
        ["Identity/get", {
          accountId: this.accountId,
        }, "0"]
      ]);

      if (response.methodResponses?.[0]?.[0] === "Identity/get") {
        const rawIdentities = (response.methodResponses[0][1].list || []) as Array<{
          id: string;
          name?: string;
          email: string;
          replyTo?: Array<{ email?: string; name?: string }>;
          bcc?: Array<{ email?: string; name?: string }>;
          textSignature?: string;
          htmlSignature?: string;
          mayDelete?: boolean;
        }>;

        return rawIdentities.map((id) => ({
          id: id.id,
          name: id.name || id.email,
          email: id.email,
          replyTo: id.replyTo,
          bcc: id.bcc,
          textSignature: id.textSignature,
          htmlSignature: id.htmlSignature,
          mayDelete: id.mayDelete ?? false,
        })) as Identity[];
      }

      return [];
    } catch (error) {
      console.error("Failed to fetch identities:", error);
      return [];
    }
  }

  async getEmails(mailboxId?: string, accountId?: string, limit: number = 50, position: number = 0): Promise<{ emails: Email[], hasMore: boolean, total: number }> {
    try {
      // Use provided accountId or fallback to primary account
      const targetAccountId = accountId || this.accountId;

      // Build filter - only add inMailbox if we have a mailboxId
      const filter: { inMailbox?: string } = {};
      if (mailboxId && mailboxId !== '') {
        filter.inMailbox = mailboxId;
      }

      const response = await this.request([
        ["Email/query", {
          accountId: targetAccountId,
          filter: filter,
          sort: [{ property: "receivedAt", isAscending: false }],
          limit: limit,
          position: position,
        }, "0"],
        ["Email/get", {
          accountId: targetAccountId,
          "#ids": {
            resultOf: "0",
            name: "Email/query",
            path: "/ids",
          },
          properties: [
            "id",
            "threadId",
            "mailboxIds",
            "keywords",
            "size",
            "receivedAt",
            "from",
            "to",
            "cc",
            "subject",
            "preview",
            "hasAttachment",
          ],
        }, "1"],
      ]);

      const queryResponse = response.methodResponses?.[0]?.[1];
      const getResponse = response.methodResponses?.[1]?.[1];

      if (response.methodResponses?.[1]?.[0] === "Email/get" && getResponse) {
        const emails = getResponse.list || [];

        // Stalwart doesn't return 'total', so we use a different strategy:
        // If we got exactly 'limit' emails, there might be more
        // If we got fewer, we've reached the end
        const total = queryResponse?.total || 0;
        const hasMore = total > 0
          ? (position + emails.length) < total  // Use total if available
          : emails.length === limit;             // Otherwise, check if we got a full page

        // If fetching from a shared account, namespace the mailboxIds to match our store
        const isSharedAccount = accountId && accountId !== this.accountId;
        if (isSharedAccount) {
          emails.forEach((email: Email) => {
            if (email.mailboxIds) {
              const namespacedMailboxIds: Record<string, boolean> = {};
              Object.keys(email.mailboxIds).forEach(mbId => {
                namespacedMailboxIds[`${accountId}:${mbId}`] = email.mailboxIds[mbId];
              });
              email.mailboxIds = namespacedMailboxIds;
            }
          });
        }

        return { emails, hasMore, total };
      }

      return { emails: [], hasMore: false, total: 0 };
    } catch (error) {
      console.error('Failed to get emails:', error);
      return { emails: [], hasMore: false, total: 0 };
    }
  }

  async getEmail(emailId: string, accountId?: string): Promise<Email | null> {
    try {
      // Use provided accountId or fallback to primary account
      const targetAccountId = accountId || this.accountId;

      const response = await this.request([
        ["Email/get", {
          accountId: targetAccountId,
          ids: [emailId],
          properties: [
            "id",
            "threadId",
            "mailboxIds",
            "keywords",
            "size",
            "receivedAt",
            "sentAt",
            "from",
            "to",
            "cc",
            "bcc",
            "replyTo",
            "subject",
            "preview",
            "textBody",
            "htmlBody",
            "bodyValues",
            "hasAttachment",
            "attachments",
            "messageId",
            "inReplyTo",
            "references",
            "headers",
          ],
          fetchTextBodyValues: true,
          fetchHTMLBodyValues: true,
          fetchAllBodyValues: true,
          maxBodyValueBytes: 256000,
        }, "0"],
      ]);

      if (response.methodResponses?.[0]?.[0] === "Email/get") {
        const emails = response.methodResponses[0][1].list || [];
        const email = emails[0];

        if (email) {
          // If fetching from a shared account, namespace the mailboxIds to match our store
          const isSharedAccount = accountId && accountId !== this.accountId;
          if (isSharedAccount && email.mailboxIds) {
            const namespacedMailboxIds: Record<string, boolean> = {};
            Object.keys(email.mailboxIds).forEach(mbId => {
              namespacedMailboxIds[`${accountId}:${mbId}`] = email.mailboxIds[mbId];
            });
            email.mailboxIds = namespacedMailboxIds;
          }

          // Parse headers if available
          if (email.headers) {
            // Import the parsing functions
            const { parseAuthenticationResults, parseSpamScore, parseSpamLLM } = await import('@/lib/email-headers');

            // Convert headers array to Record format if needed
            let headersRecord: Record<string, string | string[]>;
            if (Array.isArray(email.headers)) {
              headersRecord = {};
              (email.headers as JMAPEmailHeader[]).forEach((header) => {
                if (header && header.name && header.value) {
                  // If header already exists, convert to array or append
                  if (headersRecord[header.name]) {
                    if (Array.isArray(headersRecord[header.name])) {
                      (headersRecord[header.name] as string[]).push(header.value);
                    } else {
                      headersRecord[header.name] = [headersRecord[header.name] as string, header.value];
                    }
                  } else {
                    headersRecord[header.name] = header.value;
                  }
                }
              });
              // Replace array with record for easier access
              email.headers = headersRecord;
            } else {
              headersRecord = email.headers as Record<string, string | string[]>;
            }

            // Parse Authentication-Results header
            const authResultsHeader = headersRecord['Authentication-Results'];
            if (authResultsHeader) {
              const headerValue = Array.isArray(authResultsHeader) ? authResultsHeader[0] : authResultsHeader;
              email.authenticationResults = parseAuthenticationResults(headerValue);
            }

            // Parse Spam headers
            const spamHeaders = ['X-Spam-Status', 'X-Spam-Result', 'X-Rspamd-Score'];
            for (const header of spamHeaders) {
              if (headersRecord[header]) {
                const headerValue = Array.isArray(headersRecord[header]) ? headersRecord[header][0] : headersRecord[header];
                const spamResult = parseSpamScore(headerValue as string);
                if (spamResult) {
                  email.spamScore = spamResult.score;
                  email.spamStatus = spamResult.status;
                  break;
                }
              }
            }

            // Parse X-Spam-LLM header
            if (headersRecord['X-Spam-LLM']) {
              const llmHeader = Array.isArray(headersRecord['X-Spam-LLM'])
                ? headersRecord['X-Spam-LLM'][0]
                : headersRecord['X-Spam-LLM'];
              const llmResult = parseSpamLLM(llmHeader as string);
              if (llmResult) {
                email.spamLLM = llmResult;
              }
            }
          }

          return email;
        }

        return null;
      }

      return null;
    } catch (error) {
      console.error('Failed to get email:', error);
      return null;
    }
  }

  async markAsRead(emailId: string, read: boolean = true, accountId?: string): Promise<void> {
    // Use provided accountId or fallback to primary account
    const targetAccountId = accountId || this.accountId;

    await this.request([
      ["Email/set", {
        accountId: targetAccountId,
        update: {
          [emailId]: {
            "keywords/$seen": read,
          },
        },
      }, "0"],
    ]);
  }

  async batchMarkAsRead(emailIds: string[], read: boolean = true): Promise<void> {
    if (emailIds.length === 0) return;

    const updates: Record<string, { "keywords/$seen": boolean }> = {};
    emailIds.forEach(id => {
      updates[id] = {
        "keywords/$seen": read,
      };
    });

    await this.request([
      ["Email/set", {
        accountId: this.accountId,
        update: updates,
      }, "0"],
    ]);
  }

  async toggleStar(emailId: string, starred: boolean): Promise<void> {
    await this.request([
      ["Email/set", {
        accountId: this.accountId,
        update: {
          [emailId]: {
            "keywords/$flagged": starred,
          },
        },
      }, "0"],
    ]);
  }

  async updateEmailKeywords(emailId: string, keywords: Record<string, boolean>): Promise<void> {
    await this.request([
      ["Email/set", {
        accountId: this.accountId,
        update: {
          [emailId]: {
            keywords,
          },
        },
      }, "0"],
    ]);
  }

  async deleteEmail(emailId: string): Promise<void> {
    await this.request([
      ["Email/set", {
        accountId: this.accountId,
        destroy: [emailId],
      }, "0"],
    ]);
  }

  async moveToTrash(emailId: string, trashMailboxId: string, accountId?: string): Promise<void> {
    const targetAccountId = accountId || this.accountId;
    await this.request([
      ["Email/set", {
        accountId: targetAccountId,
        update: {
          [emailId]: {
            mailboxIds: { [trashMailboxId]: true },
          },
        },
      }, "0"],
    ]);
  }

  async batchDeleteEmails(emailIds: string[]): Promise<void> {
    if (emailIds.length === 0) return;

    await this.request([
      ["Email/set", {
        accountId: this.accountId,
        destroy: emailIds,
      }, "0"],
    ]);
  }

  async batchMoveEmails(emailIds: string[], toMailboxId: string): Promise<void> {
    if (emailIds.length === 0) return;

    const updates: Record<string, { mailboxIds: Record<string, boolean> }> = {};
    emailIds.forEach(id => {
      updates[id] = {
        mailboxIds: { [toMailboxId]: true },
      };
    });

    await this.request([
      ["Email/set", {
        accountId: this.accountId,
        update: updates,
      }, "0"],
    ]);
  }

  async moveEmail(emailId: string, toMailboxId: string): Promise<void> {
    await this.request([
      ["Email/set", {
        accountId: this.accountId,
        update: {
          [emailId]: {
            mailboxIds: { [toMailboxId]: true },
          },
        },
      }, "0"],
    ]);
  }

  async searchEmails(query: string, mailboxId?: string, accountId?: string, limit: number = 50, position: number = 0, advancedFilter?: Record<string, unknown>): Promise<{ emails: Email[], hasMore: boolean, total: number }> {
    try {
      // Use provided accountId or fallback to primary account
      const targetAccountId = accountId || this.accountId;

      // Build filter with text search, optionally scoped to a mailbox
      const filter: Record<string, unknown> = {};
      
      // Use advanced filter if provided, otherwise use simple text query
      if (advancedFilter) {
        Object.assign(filter, advancedFilter);
      } else if (query) {
        filter.text = query;
      }
      
      if (mailboxId) {
        filter.inMailbox = mailboxId;
      }

      const response = await this.request([
        ["Email/query", {
          accountId: targetAccountId,
          filter: filter,
          sort: [{ property: "receivedAt", isAscending: false }],
          limit: limit,
          position: position,
        }, "0"],
        ["Email/get", {
          accountId: targetAccountId,
          "#ids": {
            resultOf: "0",
            name: "Email/query",
            path: "/ids",
          },
          properties: [
            "id",
            "threadId",
            "mailboxIds",
            "keywords",
            "size",
            "receivedAt",
            "from",
            "to",
            "cc",
            "subject",
            "preview",
            "hasAttachment",
          ],
        }, "1"],
      ]);

      const queryResponse = response.methodResponses?.[0]?.[1];
      const emails = response.methodResponses?.[1]?.[1]?.list || [];

      // Stalwart doesn't always return 'total', so we use a different strategy:
      // If we got exactly 'limit' emails, there might be more
      // If we got fewer, we've reached the end
      const total = queryResponse?.total || 0;
      const hasMore = total > 0
        ? (position + emails.length) < total  // Use total if available
        : emails.length === limit;             // Otherwise, check if we got a full page

      return { emails, hasMore, total };
    } catch (error) {
      console.error('Search failed:', error);
      return { emails: [], hasMore: false, total: 0 };
    }
  }

  // Thread methods for conversation view
  async getThread(threadId: string, accountId?: string): Promise<Thread | null> {
    try {
      const targetAccountId = accountId || this.accountId;

      const response = await this.request([
        ["Thread/get", {
          accountId: targetAccountId,
          ids: [threadId],
        }, "0"],
      ]);

      if (response.methodResponses?.[0]?.[0] === "Thread/get") {
        const threads = response.methodResponses[0][1].list || [];
        return threads[0] || null;
      }

      return null;
    } catch (error) {
      console.error('Failed to get thread:', error);
      return null;
    }
  }

  async getThreadEmails(threadId: string, accountId?: string): Promise<Email[]> {
    try {
      const targetAccountId = accountId || this.accountId;

      // First get the thread to find all email IDs
      const thread = await this.getThread(threadId, accountId);
      if (!thread || !thread.emailIds || thread.emailIds.length === 0) {
        return [];
      }

      // Fetch all emails in the thread
      const response = await this.request([
        ["Email/get", {
          accountId: targetAccountId,
          ids: thread.emailIds,
          properties: [
            "id",
            "threadId",
            "mailboxIds",
            "keywords",
            "size",
            "receivedAt",
            "from",
            "to",
            "cc",
            "subject",
            "preview",
            "hasAttachment",
          ],
        }, "0"],
      ]);

      if (response.methodResponses?.[0]?.[0] === "Email/get") {
        const emails = response.methodResponses[0][1].list || [];

        // If fetching from a shared account, namespace the mailboxIds
        const isSharedAccount = accountId && accountId !== this.accountId;
        if (isSharedAccount) {
          emails.forEach((email: Email) => {
            if (email.mailboxIds) {
              const namespacedMailboxIds: Record<string, boolean> = {};
              Object.keys(email.mailboxIds).forEach(mbId => {
                namespacedMailboxIds[`${accountId}:${mbId}`] = email.mailboxIds[mbId];
              });
              email.mailboxIds = namespacedMailboxIds;
            }
          });
        }

        // Sort by receivedAt descending (newest first)
        return emails.sort((a: Email, b: Email) =>
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        );
      }

      return [];
    } catch (error) {
      console.error('Failed to get thread emails:', error);
      return [];
    }
  }

  async createDraft(
    to: string[],
    subject: string,
    body: string,
    cc?: string[],
    bcc?: string[],
    draftId?: string,
    attachments?: Array<{ blobId: string; name: string; type: string; size: number }>
  ): Promise<string> {
    // Find the drafts mailbox (use originalId if available, otherwise id)
    const mailboxes = await this.getMailboxes();
    const draftsMailbox = mailboxes.find(mb => mb.role === 'drafts');

    if (!draftsMailbox) {
      throw new Error('No drafts mailbox found');
    }

    // Use originalId for JMAP operations (for shared mailboxes) or id for primary account
    const draftsMailboxId = draftsMailbox.originalId || draftsMailbox.id;

    // Get identity from JMAP
    const identities = await this.getIdentities();
    let fromAddress: { email: string; name?: string } = { email: this.username };
    
    if (identities.length > 0) {
      // Use the first identity (or find one matching the username)
      const matchingIdentity = identities.find((id) => id.email === this.username);
      const identity = matchingIdentity || identities[0];
      fromAddress = {
        email: identity.email,
        ...(identity.name && identity.name !== identity.email ? { name: identity.name } : {})
      };
    }

    const emailId = `draft-${Date.now()}`;

    // Build email object with attachments if provided
    interface EmailDraft {
      from: { email: string; name?: string }[];
      to: { email: string }[];
      cc?: { email: string }[];
      bcc?: { email: string }[];
      subject: string;
      keywords: Record<string, boolean>;
      mailboxIds: Record<string, boolean>;
      bodyValues: Record<string, { value: string }>;
      textBody: { partId: string }[];
      attachments?: { blobId: string; type: string; name: string; disposition: string }[];
    }
    const emailData: EmailDraft = {
      from: [fromAddress],
      to: to.map(email => ({ email })),
      cc: cc?.map(email => ({ email })),
      bcc: bcc?.map(email => ({ email })),
      subject: subject,
      keywords: { "$draft": true },
      mailboxIds: { [draftsMailboxId]: true },
      bodyValues: {
        "1": {
          value: body,
        },
      },
      textBody: [
        {
          partId: "1",
        },
      ],
    };

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailData.attachments = attachments.map(att => ({
        blobId: att.blobId,
        type: att.type,
        name: att.name,
        disposition: "attachment",
      }));
    }

    // If updating an existing draft, destroy it first then create new one
    // This is simpler than trying to update individual fields
    const methodCalls: JMAPMethodCall[] = [];

    if (draftId) {
      // Delete old draft
      methodCalls.push(["Email/set", {
        accountId: this.accountId,
        destroy: [draftId],
      }, "0"]);

      // Create new draft
      methodCalls.push(["Email/set", {
        accountId: this.accountId,
        create: {
          [emailId]: emailData
        },
      }, "1"]);
    } else {
      // Just create new draft
      methodCalls.push(["Email/set", {
        accountId: this.accountId,
        create: {
          [emailId]: emailData
        },
      }, "0"]);
    }

    const response = await this.request(methodCalls);

    console.log('Draft save response:', JSON.stringify(response, null, 2));

    // If we're updating (destroy + create), check the second response
    // Otherwise check the first response
    const responseIndex = draftId ? 1 : 0;

    if (response.methodResponses?.[responseIndex]?.[0] === "Email/set") {
      const result = response.methodResponses[responseIndex][1];

      // Check for errors
      if (result.notCreated || result.notUpdated) {
        const errors = result.notCreated || result.notUpdated;
        const firstError = Object.values(errors)[0] as { description?: string; type?: string };
        console.error('Draft save error:', firstError);
        throw new Error(firstError?.description || firstError?.type || 'Failed to save draft');
      }

      if (result.created?.[emailId]) {
        console.log('Draft created successfully:', result.created[emailId].id);
        return result.created[emailId].id;
      }
    }

    console.error('Unexpected draft save response:', response);
    throw new Error('Failed to save draft');
  }

  async sendEmail(
    to: string[],
    subject: string,
    body: string,
    cc?: string[],
    bcc?: string[],
    draftId?: string,
    _aliasEmail?: string
  ): Promise<void> {
    const emailId = draftId || `draft-${Date.now()}`;

    // Find the Sent mailbox (use originalId if available, otherwise id)
    const mailboxes = await this.getMailboxes();
    const sentMailbox = mailboxes.find(mb => mb.role === 'sent');

    if (!sentMailbox) {
      throw new Error('No sent mailbox found');
    }

    // Use originalId for JMAP operations (for shared mailboxes) or id for primary account
    const sentMailboxId = sentMailbox.originalId || sentMailbox.id;

    // Get identity from JMAP
    const identities = await this.getIdentities();
    let identityId = this.accountId; // fallback
    let fromAddress: { email: string; name?: string } = { email: this.username };

    if (identities.length > 0) {
      // Use the first identity (or find one matching the username)
      const matchingIdentity = identities.find((id) => id.email === this.username);
      const identity = matchingIdentity || identities[0];
      identityId = identity.id;
      fromAddress = {
        email: identity.email,
        ...(identity.name && identity.name !== identity.email ? { name: identity.name } : {})
      };
    }

    const methodCalls: JMAPMethodCall[] = [];

    // If we have a draftId, update it and remove draft keyword, move to Sent
    // Otherwise, create a new email in Sent
    if (draftId) {
      methodCalls.push(["Email/set", {
        accountId: this.accountId,
        update: {
          [draftId]: {
            "keywords/$draft": false,
            "keywords/$seen": true,
            mailboxIds: { [sentMailboxId]: true },
          },
        },
      }, "0"]);
      methodCalls.push(["EmailSubmission/set", {
        accountId: this.accountId,
        create: {
          "1": {
            emailId: draftId,
            identityId: identityId,
          },
        },
      }, "1"]);
    } else {
      methodCalls.push(["Email/set", {
        accountId: this.accountId,
        create: {
          [emailId]: {
            from: [fromAddress],
            to: to.map(email => ({ email })),
            cc: cc?.map(email => ({ email })),
            bcc: bcc?.map(email => ({ email })),
            subject: subject,
            keywords: { "$seen": true },
            mailboxIds: { [sentMailboxId]: true },
            bodyValues: {
              "1": {
                value: body,
              },
            },
            textBody: [
              {
                partId: "1",
              },
            ],
          },
        },
      }, "0"]);
      methodCalls.push(["EmailSubmission/set", {
        accountId: this.accountId,
        create: {
          "1": {
            emailId: `#${emailId}`,
            identityId: identityId,
          },
        },
      }, "1"]);
    }

    const response = await this.request(methodCalls);

    // Check for errors in the response
    if (response.methodResponses) {
      for (const [methodName, result] of response.methodResponses) {
        if (methodName.endsWith('/error')) {
          console.error('JMAP method error:', result);
          throw new Error(result.description || `Failed to send email: ${result.type}`);
        }

        // Check for notCreated/notUpdated
        if (result.notCreated || result.notUpdated) {
          const errors = result.notCreated || result.notUpdated;
          const firstError = Object.values(errors)[0] as { description?: string; type?: string };
          console.error('Email send error:', firstError);
          throw new Error(firstError?.description || firstError?.type || 'Failed to send email');
        }
      }
    }
  }

  async uploadBlob(file: File): Promise<{ blobId: string; size: number; type: string }> {
    if (!this.session) {
      throw new Error('Not connected. Call connect() first.');
    }

    // Get upload URL from session
    const uploadUrl = this.session.uploadUrl;
    if (!uploadUrl) {
      throw new Error('Upload URL not available');
    }

    // Replace accountId in the upload URL
    const finalUploadUrl = uploadUrl.replace('{accountId}', encodeURIComponent(this.accountId));
    console.log('Uploading file to:', finalUploadUrl);
    console.log('File info:', { name: file.name, size: file.size, type: file.type });

    const response = await fetch(finalUploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file, // Send the file directly as binary
    });

    console.log('Upload response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', errorText);
      throw new Error(`Failed to upload file: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('Upload response body:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
      console.log('Parsed upload response:', JSON.stringify(result, null, 2));
    } catch {
      console.error('Failed to parse upload response as JSON:', responseText);
      throw new Error('Invalid JSON response from upload');
    }

    // Try different response formats
    // Format 1: Direct response { blobId, type, size }
    if (result.blobId) {
      console.log('Using direct response format');
      return {
        blobId: result.blobId,
        size: result.size || file.size,
        type: result.type || file.type,
      };
    }

    // Format 2: Nested under accountId { accountId: { blobId, type, size } }
    const blobInfo = result[this.accountId];
    if (blobInfo && blobInfo.blobId) {
      console.log('Using accountId-nested response format');
      return {
        blobId: blobInfo.blobId,
        size: blobInfo.size || file.size,
        type: blobInfo.type || file.type,
      };
    }

    // If neither format works, show what we got
    console.error('Unexpected upload response format:', result);
    throw new Error('Invalid upload response: blobId not found');
  }

  getBlobDownloadUrl(blobId: string, name?: string, type?: string): string {
    if (!this.downloadUrl) {
      throw new Error('Download URL not available. Please reconnect.');
    }

    // The downloadUrl is a URI Template (RFC 6570 level 1) with variables
    // like {accountId}, {blobId}, {name}, and {type}
    let url = this.downloadUrl;

    // Replace template variables with actual values
    url = url.replace('{accountId}', encodeURIComponent(this.accountId));
    url = url.replace('{blobId}', encodeURIComponent(blobId));

    // Replace {name} - use a default if not provided
    const fileName = name || 'download';
    url = url.replace('{name}', encodeURIComponent(fileName));

    // Replace {type} - URL encode it since it may contain slashes (e.g., "application/pdf")
    // If type is not provided, use a generic binary type
    const mimeType = type || 'application/octet-stream';
    url = url.replace('{type}', encodeURIComponent(mimeType));

    return url;
  }

  // Capability checking methods
  getCapabilities(): Record<string, unknown> {
    return this.capabilities;
  }

  hasCapability(capability: string): boolean {
    return capability in this.capabilities;
  }

  getMaxSizeUpload(): number {
    const coreCapability = this.capabilities["urn:ietf:params:jmap:core"] as { maxSizeUpload?: number } | undefined;
    return coreCapability?.maxSizeUpload || 0;
  }

  getMaxCallsInRequest(): number {
    const coreCapability = this.capabilities["urn:ietf:params:jmap:core"] as { maxCallsInRequest?: number } | undefined;
    return coreCapability?.maxCallsInRequest || 50;
  }

  getEventSourceUrl(): string | null {
    const session = this.session;
    if (!session) {
      return null;
    }
    // RFC 8620: eventSourceUrl is at session root level
    if (session.eventSourceUrl) {
      return session.eventSourceUrl;
    }
    // Some servers may put it in capabilities
    const coreCapability = session.capabilities?.["urn:ietf:params:jmap:core"] as { eventSourceUrl?: string } | undefined;
    if (coreCapability?.eventSourceUrl) {
      return coreCapability.eventSourceUrl;
    }
    return null;
  }

  getWebSocketUrl(): string | null {
    const websocketCapability = this.capabilities["urn:ietf:params:jmap:websocket"] as { url?: string; supportsPush?: boolean } | undefined;
    return websocketCapability?.url || null;
  }

  supportsWebSocketPush(): boolean {
    const websocketCapability = this.capabilities["urn:ietf:params:jmap:websocket"] as { url?: string; supportsPush?: boolean } | undefined;
    return websocketCapability?.supportsPush === true;
  }

  getAccountId(): string {
    return this.accountId;
  }

  supportsEmailSubmission(): boolean {
    return this.hasCapability("urn:ietf:params:jmap:submission");
  }

  supportsQuota(): boolean {
    return this.hasCapability("urn:ietf:params:jmap:quota");
  }

  supportsVacationResponse(): boolean {
    return this.hasCapability("urn:ietf:params:jmap:vacationresponse");
  }

  // Debug method to log all server capabilities
  logCapabilities(): void {
    console.log('JMAP Server Capabilities:', this.capabilities);
    console.log('Primary Accounts:', this.session?.primaryAccounts);
    console.log('Contact Support:', this.supportsAddressBook());
    console.log('Contact Standard:', this.getContactStandard());
    console.log('Contact Account ID:', this.getContactAccountId());
    console.log('RFC 9610 (Contacts) Support:', this.hasCapability("urn:ietf:params:jmap:contacts"));
    console.log('RFC 8621 (AddressBook) Support:', this.hasCapability("urn:ietf:params:jmap:addressbook"));
    
    // Log the contacts capability details if available
    const contactsCapability = this.capabilities["urn:ietf:params:jmap:contacts"];
    if (contactsCapability) {
      console.log('RFC 9610 Capability Details:', contactsCapability);
    }
  }

  // Try to discover available contact methods by checking server capabilities
  async discoverContactMethods(): Promise<string[]> {
    if (!this.supportsAddressBook()) {
      return [];
    }

    const contactAccountId = this.getContactAccountId();
    if (!contactAccountId) {
      return [];
    }

    // Try common method names
    const methodsToTry = [
      'Contact/get',
      'Contact/set',
      'ContactGroup/get',
      'ContactGroup/set',
      'AddressBook/get',
      'AddressBook/set',
    ];

    const availableMethods: string[] = [];

    for (const method of methodsToTry) {
      try {
        const standard = this.getContactStandard();
        const capability = standard === 'contacts' 
          ? "urn:ietf:params:jmap:contacts" 
          : "urn:ietf:params:jmap:addressbook";

        // Try a minimal request to see if method exists
        const response = await this.request([
          [method, {
            accountId: contactAccountId,
            ids: [],
          }, "0"]
        ], ["urn:ietf:params:jmap:core", capability]);

        const responseMethod = response.methodResponses?.[0]?.[0];
        if (!responseMethod?.endsWith('/error') || 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (response.methodResponses[0][1] as any)?.type !== 'unknownMethod') {
          availableMethods.push(method);
        }
      } catch (error) {
        // Method doesn't exist or error occurred
        console.log(`Method ${method} not available:`, error);
      }
    }

    return availableMethods;
  }

  async downloadBlob(blobId: string, name?: string, type?: string): Promise<void> {
    const url = this.getBlobDownloadUrl(blobId, name, type);

    const response = await fetch(url, {
      headers: {
        'Authorization': this.authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download attachment: ${response.status}`);
    }

    // Get the blob from the response
    const blob = await response.blob();

    // Create a temporary URL for the blob
    const blobUrl = URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = name || 'download';
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }

  // Real-time Updates via Polling (EventSource has auth limitations with Basic Auth)
  private pollingInterval: NodeJS.Timeout | null = null;
  private pollingStates: { [key: string]: string } = {};

  setupPushNotifications(): boolean {
    // Use polling instead of EventSource due to Basic Auth limitations
    // EventSource can't send Authorization headers, and URL-embedded credentials
    // get decoded by browsers, breaking auth for usernames/passwords with special chars

    // Initial state fetch
    this.fetchCurrentStates();

    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.checkForStateChanges();
    }, 15000); // Poll every 15 seconds

    return true;
  }

  private async fetchCurrentStates(): Promise<void> {
    try {
      // Get current states from server using JMAP query
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader,
        },
        body: JSON.stringify({
          using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
          methodCalls: [
            ['Mailbox/get', { accountId: this.accountId, ids: null, properties: ['id'] }, 'a'],
            ['Email/get', { accountId: this.accountId, ids: [], properties: ['id'] }, 'b'],
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Extract states from response
        for (const [method, result] of data.methodResponses) {
          if (method === 'Mailbox/get' && result.state) {
            this.pollingStates['Mailbox'] = result.state;
          }
          if (method === 'Email/get' && result.state) {
            this.pollingStates['Email'] = result.state;
          }
        }
      }
    } catch {
      // Silently fail - polling will retry
    }
  }

  private async checkForStateChanges(): Promise<void> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader,
        },
        body: JSON.stringify({
          using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
          methodCalls: [
            ['Mailbox/get', { accountId: this.accountId, ids: null, properties: ['id'] }, 'a'],
            ['Email/get', { accountId: this.accountId, ids: [], properties: ['id'] }, 'b'],
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const changes: { [key: string]: string } = {};
        let hasChanges = false;

        for (const [method, result] of data.methodResponses) {
          if (method === 'Mailbox/get' && result.state) {
            if (this.pollingStates['Mailbox'] && this.pollingStates['Mailbox'] !== result.state) {
              changes['Mailbox'] = result.state;
              hasChanges = true;
            }
            this.pollingStates['Mailbox'] = result.state;
          }
          if (method === 'Email/get' && result.state) {
            if (this.pollingStates['Email'] && this.pollingStates['Email'] !== result.state) {
              changes['Email'] = result.state;
              hasChanges = true;
            }
            this.pollingStates['Email'] = result.state;
          }
        }

        if (hasChanges && this.stateChangeCallback) {
          this.stateChangeCallback({
            '@type': 'StateChange',
            changed: {
              [this.accountId]: changes,
            },
          });
        }
      }
    } catch {
      // Silently fail - polling will retry
    }
  }

  closePushNotifications(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.stateChangeCallback = null;
    this.pollingStates = {};
  }

  onStateChange(callback: (change: StateChange) => void): void {
    this.stateChangeCallback = callback;
  }

  getLastStates(): AccountStates {
    return { ...this.lastStates };
  }

  setLastStates(states: AccountStates): void {
    this.lastStates = { ...states };
  }

  // AddressBook/Contact methods
  // Supports both RFC 8621 (AddressBook) and RFC 9610 (JMAP for Contacts)
  private getContactAccountId(): string | null {
    if (!this.session) {
      return null;
    }
    // Try RFC 9610 (JMAP for Contacts) first - used by Stalwart
    const contactsAccount = this.session.primaryAccounts?.["urn:ietf:params:jmap:contacts"];
    if (contactsAccount) {
      return contactsAccount;
    }
    // Try RFC 8621 (AddressBook) as fallback
    const addressBookAccount = this.session.primaryAccounts?.["urn:ietf:params:jmap:addressbook"];
    if (addressBookAccount) {
      return addressBookAccount;
    }
    // Fallback to mail account if neither found
    return this.accountId;
  }

  supportsAddressBook(): boolean {
    // Check for RFC 9610 (JMAP for Contacts) - used by Stalwart
    if (this.hasCapability("urn:ietf:params:jmap:contacts")) {
      return true;
    }
    // Check for RFC 8621 (AddressBook) as fallback
    return this.hasCapability("urn:ietf:params:jmap:addressbook");
  }

  // Determine which contact standard to use
  private getContactStandard(): 'contacts' | 'addressbook' | null {
    if (this.hasCapability("urn:ietf:params:jmap:contacts")) {
      return 'contacts'; // RFC 9610 - Stalwart uses this
    }
    if (this.hasCapability("urn:ietf:params:jmap:addressbook")) {
      return 'addressbook'; // RFC 8621
    }
    return null;
  }

  /**
   * Get jmap-js wrapper (lazy-loaded)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getJMAPJSWrapper(): Promise<any> {
    if (this.jmapJSWrapper) {
      return this.jmapJSWrapper;
    }

    // Dynamic import to avoid loading jmap-js if not needed
    try {
      const { JMAPJSWrapper } = await import('./jmap-js-wrapper');
      this.jmapJSWrapper = new JMAPJSWrapper(this);
      await this.jmapJSWrapper.initialize();
      return this.jmapJSWrapper;
    } catch (error) {
      console.warn('jmap-js not available, falling back to native implementation:', error);
      return null;
    }
  }

  async getContacts(): Promise<Contact[]> {
    if (!this.supportsAddressBook()) {
      return [];
    }

    // Try using jmap-js if available
    try {
      const wrapper = await this.getJMAPJSWrapper();
      if (wrapper) {
        return await wrapper.getContacts();
      }
    } catch (error) {
      console.warn('Failed to use jmap-js for contacts, falling back to native:', error);
    }

    const contactAccountId = this.getContactAccountId();
    if (!contactAccountId) {
      return [];
    }

    const standard = this.getContactStandard();
    if (!standard) {
      return [];
    }

    try {
      // RFC 9610 (JMAP for Contacts) uses ContactCard/get for JSContact format
      // RFC 8621 (AddressBook) uses AddressBook/get
      let methodName = standard === 'contacts' ? 'ContactCard/get' : 'AddressBook/get';
      const capability = standard === 'contacts' 
        ? "urn:ietf:params:jmap:contacts" 
        : "urn:ietf:params:jmap:addressbook";

      let response = await this.request([
        [methodName, {
          accountId: contactAccountId,
        }, "0"]
      ], ["urn:ietf:params:jmap:core", capability]);

      // If ContactCard/get fails, try Contact/get as fallback (some servers might use this)
      if (standard === 'contacts' && response.methodResponses?.[0]?.[0] === 'error') {
        const error = response.methodResponses[0][1];
        if (error.type === 'unknownMethod' && methodName === 'ContactCard/get') {
          console.log('ContactCard/get not available, trying Contact/get...');
          methodName = 'Contact/get';
          response = await this.request([
            [methodName, {
              accountId: contactAccountId,
            }, "0"]
          ], ["urn:ietf:params:jmap:core", capability]);
        }
      }

      const responseMethod = response.methodResponses?.[0]?.[0];
      if (responseMethod === methodName || responseMethod === "ContactCard/get" || responseMethod === "Contact/get" || responseMethod === "AddressBook/get") {
        const contacts = response.methodResponses[0][1].list || [];
        if (contacts.length > 0) {
          console.log('Sample contact structure from server:', JSON.stringify(contacts[0], null, 2));
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return contacts.map((contact: any) => this.mapJMAPContactToContact(contact));
      }

      return [];
    } catch (error) {
      console.error('Failed to get contacts:', error);
      return [];
    }
  }

  async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.supportsAddressBook()) {
      throw new Error('Contacts not supported by server');
    }

    const contactAccountId = this.getContactAccountId();
    if (!contactAccountId) {
      throw new Error('No contact account found');
    }

    const standard = this.getContactStandard();
    if (!standard) {
      throw new Error('No contact standard available');
    }

    const contactId = `contact-${Date.now()}`;
    const jmapContact = this.mapContactToJMAPContact(contact);

    // RFC 9610: Contacts must belong to at least one address book
    // addressBookIds must be an object/map: { "addressBookId": true }, not an array
    if (standard === 'contacts') {
      const defaultAddressBookId = await this.getOrCreateDefaultAddressBook(contactAccountId);
      jmapContact.addressBookIds = {
        [defaultAddressBookId]: true
      };
    }

    // RFC 9610 (JMAP for Contacts) uses ContactCard/set for JSContact format
    // RFC 8621 (AddressBook) uses AddressBook/set
    // Try ContactCard/set first for RFC 9610, with fallbacks
    let methodName = standard === 'contacts' ? 'ContactCard/set' : 'AddressBook/set';
    const capability = standard === 'contacts' 
      ? "urn:ietf:params:jmap:contacts" 
      : "urn:ietf:params:jmap:addressbook";

    // Log capability details to help debug
    const contactsCapability = this.capabilities["urn:ietf:params:jmap:contacts"];
    console.log('Creating contact with:', { 
      methodName, 
      contactAccountId, 
      jmapContact,
      capabilityDetails: contactsCapability,
      allCapabilities: Object.keys(this.capabilities)
    });

    let response = await this.request([
      [methodName, {
        accountId: contactAccountId,
        create: {
          [contactId]: jmapContact
        },
      }, "0"]
    ], ["urn:ietf:params:jmap:core", capability]);

    // Try fallback methods if ContactCard/set fails
    if (standard === 'contacts' && response.methodResponses?.[0]?.[0] === 'error') {
      const error = response.methodResponses[0][1];
      if (error.type === 'unknownMethod') {
        // Try Contact/set as fallback
        if (methodName === 'ContactCard/set') {
          console.log('ContactCard/set not available, trying Contact/set...');
          methodName = 'Contact/set';
          response = await this.request([
            [methodName, {
              accountId: contactAccountId,
              create: {
                [contactId]: jmapContact
              },
            }, "0"]
          ], ["urn:ietf:params:jmap:core", capability]);
        }
        // If Contact/set also fails, try AddressBook/set (Stalwart might use this)
        if (response.methodResponses?.[0]?.[0] === 'error' && methodName === 'Contact/set') {
          const error2 = response.methodResponses[0][1];
          if (error2.type === 'unknownMethod') {
            console.log('Contact/set not available, trying AddressBook/set...');
            methodName = 'AddressBook/set';
            response = await this.request([
              [methodName, {
                accountId: contactAccountId,
                create: {
                  [contactId]: jmapContact
                },
              }, "0"]
            ], ["urn:ietf:params:jmap:core", capability]);
          }
        }
      }
    }

    console.log('Contact creation response:', JSON.stringify(response, null, 2));

    const responseMethod = response.methodResponses?.[0]?.[0];
    
    // Check for method errors first
    if (responseMethod?.endsWith('/error')) {
      const error = response.methodResponses[0][1];
      console.error('JMAP method error:', error);
      
      // If method is unknown, provide helpful error message
      if (error.type === 'unknownMethod') {
        console.warn('⚠ Contact creation via JMAP may not be fully supported by this server.');
        console.warn('  The server reports contacts capability but does not support write operations.');
        console.warn('  Contacts will be saved locally only.');
        throw new Error('Contact creation not supported: server does not support write operations for contacts');
      }
      
      throw new Error(error.description || error.type || 'Failed to create contact');
    }

    if (responseMethod === methodName || responseMethod === "ContactCard/set" || responseMethod === "Contact/set" || responseMethod === "AddressBook/set") {
        const result = response.methodResponses[0][1];

        // Check for errors
        if (result.notCreated) {
          const errors = result.notCreated;
          console.error('Contact creation errors:', errors);
          const firstError = Object.values(errors)[0] as { description?: string; type?: string };
          throw new Error(firstError?.description || firstError?.type || 'Failed to create contact');
        }

        if (result.created?.[contactId]) {
          return result.created[contactId].id;
        }
      } else if (responseMethod === 'error') {
        // Check for malformed argument errors
        const error = response.methodResponses[0][1];
        if (error.type === 'invalidArguments' || error.type === 'invalidResult') {
          console.error('Invalid arguments error:', error);
          console.error('Contact data sent:', jmapContact);
          throw new Error(error.description || `Invalid arguments: ${error.type}`);
        }
      }

    console.error('Unexpected response format:', response);
    throw new Error('Failed to create contact: unexpected response format');
  }

  async updateContact(contactId: string, contact: Partial<Contact>): Promise<void> {
    if (!this.supportsAddressBook()) {
      throw new Error('Contacts not supported by server');
    }

    const contactAccountId = this.getContactAccountId();
    if (!contactAccountId) {
      throw new Error('No contact account found');
    }

    const standard = this.getContactStandard();
    if (!standard) {
      throw new Error('No contact standard available');
    }

    const jmapContact = this.mapContactToJMAPContact(contact, true);

    // RFC 9610 (JMAP for Contacts) uses ContactCard/set for JSContact format
    // RFC 8621 (AddressBook) uses AddressBook/set
    let methodName = standard === 'contacts' ? 'ContactCard/set' : 'AddressBook/set';
    const capability = standard === 'contacts' 
      ? "urn:ietf:params:jmap:contacts" 
      : "urn:ietf:params:jmap:addressbook";

    let response = await this.request([
      [methodName, {
        accountId: contactAccountId,
        update: {
          [contactId]: jmapContact
        },
      }, "0"]
    ], ["urn:ietf:params:jmap:core", capability]);

    // Try fallback methods if ContactCard/set fails
    if (standard === 'contacts' && response.methodResponses?.[0]?.[0] === 'error') {
      const error = response.methodResponses[0][1];
      if (error.type === 'unknownMethod') {
        // Try Contact/set as fallback
        if (methodName === 'ContactCard/set') {
          console.log('ContactCard/set not available, trying Contact/set...');
          methodName = 'Contact/set';
          response = await this.request([
            [methodName, {
              accountId: contactAccountId,
              update: {
                [contactId]: jmapContact
              },
            }, "0"]
          ], ["urn:ietf:params:jmap:core", capability]);
        }
        // If Contact/set also fails, try AddressBook/set (Stalwart might use this)
        if (response.methodResponses?.[0]?.[0] === 'error' && methodName === 'Contact/set') {
          const error2 = response.methodResponses[0][1];
          if (error2.type === 'unknownMethod') {
            console.log('Contact/set not available, trying AddressBook/set...');
            methodName = 'AddressBook/set';
            response = await this.request([
              [methodName, {
                accountId: contactAccountId,
                update: {
                  [contactId]: jmapContact
                },
              }, "0"]
            ], ["urn:ietf:params:jmap:core", capability]);
          }
        }
      }
    }

    const responseMethod = response.methodResponses?.[0]?.[0];
    if (responseMethod === methodName || responseMethod === "ContactCard/set" || responseMethod === "Contact/set" || responseMethod === "AddressBook/set") {
        const result = response.methodResponses[0][1];

        // Check for errors
        if (result.notUpdated) {
          const errors = result.notUpdated;
          const firstError = Object.values(errors)[0] as { description?: string; type?: string };
          throw new Error(firstError?.description || firstError?.type || 'Failed to update contact');
        }
      }
  }

  async deleteContact(contactId: string): Promise<void> {
    if (!this.supportsAddressBook()) {
      throw new Error('Contacts not supported by server');
    }

    const contactAccountId = this.getContactAccountId();
    if (!contactAccountId) {
      throw new Error('No contact account found');
    }

    const standard = this.getContactStandard();
    if (!standard) {
      throw new Error('No contact standard available');
    }

    // RFC 9610 (JMAP for Contacts) uses ContactCard/set for JSContact format
    // RFC 8621 (AddressBook) uses AddressBook/set
    let methodName = standard === 'contacts' ? 'ContactCard/set' : 'AddressBook/set';
    const capability = standard === 'contacts' 
      ? "urn:ietf:params:jmap:contacts" 
      : "urn:ietf:params:jmap:addressbook";

    let response = await this.request([
      [methodName, {
        accountId: contactAccountId,
        destroy: [contactId],
      }, "0"]
    ], ["urn:ietf:params:jmap:core", capability]);

    // Try fallback methods if ContactCard/set fails
    if (standard === 'contacts' && response.methodResponses?.[0]?.[0] === 'error') {
      const error = response.methodResponses[0][1];
      if (error.type === 'unknownMethod') {
        // Try Contact/set as fallback
        if (methodName === 'ContactCard/set') {
          console.log('ContactCard/set not available, trying Contact/set...');
          methodName = 'Contact/set';
          response = await this.request([
            [methodName, {
              accountId: contactAccountId,
              destroy: [contactId],
            }, "0"]
          ], ["urn:ietf:params:jmap:core", capability]);
        }
        // If Contact/set also fails, try AddressBook/set (Stalwart might use this)
        if (response.methodResponses?.[0]?.[0] === 'error' && methodName === 'Contact/set') {
          const error2 = response.methodResponses[0][1];
          if (error2.type === 'unknownMethod') {
            console.log('Contact/set not available, trying AddressBook/set...');
            methodName = 'AddressBook/set';
            response = await this.request([
              [methodName, {
                accountId: contactAccountId,
                destroy: [contactId],
              }, "0"]
            ], ["urn:ietf:params:jmap:core", capability]);
          }
        }
      }
    }

    const responseMethod = response.methodResponses?.[0]?.[0];
    if (responseMethod === methodName || responseMethod === "ContactCard/set" || responseMethod === "Contact/set" || responseMethod === "AddressBook/set") {
      const result = response.methodResponses[0][1];

      // Check for errors
      if (result.notDestroyed) {
        const errors = result.notDestroyed;
        const firstError = Object.values(errors)[0] as { description?: string; type?: string };
        throw new Error(firstError?.description || firstError?.type || 'Failed to delete contact');
      }
    }
  }

  private mapContactToJMAPContact(contact: Partial<Contact>, _isUpdate: boolean = false): Record<string, unknown> {
    // Stalwart uses JSContact format (RFC 9553) for JMAP API
    // JSContact structure:
    // - fullName (String) - not "name"
    // - emails (Object/map) - keys are email IDs, values are {address: string, contexts?: string[]}
    // - phones (Object/map) - keys are phone IDs, values are {number: string, features?: string[], contexts?: string[]}
    // - addresses (Object/map) - keys are address IDs, values are address objects
    // - organizations (Array) - array of organization objects
    // - titles (Array) - array of title objects
    // - notes (String)
    const jmapContact: Record<string, unknown> = {};

    // JSContact Card requires at least one of: name, fullName, or nameComponents
    // Try using nameComponents structure which might be more compatible
    // If we have firstName/lastName, use nameComponents; otherwise use name
    if (contact.firstName || contact.lastName) {
      const nameComponents: Record<string, string> = {};
      if (contact.firstName) nameComponents.given = contact.firstName.trim();
      if (contact.lastName) nameComponents.family = contact.lastName.trim();
      if (Object.keys(nameComponents).length > 0) {
        jmapContact.nameComponents = nameComponents;
      }
    } else if (contact.name && contact.name.trim()) {
      // Use name as fallback if no firstName/lastName
      jmapContact.name = contact.name.trim();
    }

    // Emails - JSContact uses an object/map where keys are IDs and values are email objects
    const emails: Record<string, { address: string; contexts?: string[] }> = {};
    let emailIndex = 0;
    if (contact.email && contact.email.trim()) {
      emails[`email-${emailIndex++}`] = { address: contact.email.trim(), contexts: ['personal'] };
    }
    if (contact.emails && Array.isArray(contact.emails)) {
      contact.emails.forEach(email => {
        const trimmedEmail = email?.trim();
        if (trimmedEmail && !Object.values(emails).some(e => e.address === trimmedEmail)) {
          emails[`email-${emailIndex++}`] = { address: trimmedEmail, contexts: ['personal'] };
        }
      });
    }
    if (Object.keys(emails).length > 0) {
      jmapContact.emails = emails;
    }

    // Phones - JSContact uses an object/map where keys are IDs and values are phone objects
    const phones: Record<string, { number: string; features?: string[]; contexts?: string[] }> = {};
    let phoneIndex = 0;
    if (contact.phone && contact.phone.trim()) {
      phones[`phone-${phoneIndex++}`] = { number: contact.phone.trim(), features: ['voice'], contexts: ['mobile'] };
    }
    if (contact.phones && Array.isArray(contact.phones)) {
      contact.phones.forEach(phone => {
        const trimmedPhone = phone?.trim();
        if (trimmedPhone && !Object.values(phones).some(p => p.number === trimmedPhone)) {
          phones[`phone-${phoneIndex++}`] = { number: trimmedPhone, features: ['voice'], contexts: ['mobile'] };
        }
      });
    }
    if (Object.keys(phones).length > 0) {
      jmapContact.phones = phones;
    }

    // Organizations - JSContact uses an array of organization objects
    if (contact.company && contact.company.trim()) {
      jmapContact.organizations = [{ name: contact.company.trim() }];
    }

    // Titles - JSContact uses an array of title objects
    if (contact.jobTitle && contact.jobTitle.trim()) {
      jmapContact.titles = [{ name: contact.jobTitle.trim() }];
    }

    // Addresses - JSContact uses an object/map where keys are IDs and values are address objects
    if (contact.address) {
      const addressObj: Record<string, string> = {};
      if (contact.address.street && contact.address.street.trim()) {
        addressObj.street = contact.address.street.trim();
      }
      if (contact.address.city && contact.address.city.trim()) {
        addressObj.locality = contact.address.city.trim();
      }
      if (contact.address.state && contact.address.state.trim()) {
        addressObj.region = contact.address.state.trim();
      }
      if (contact.address.postalCode && contact.address.postalCode.trim()) {
        addressObj.postcode = contact.address.postalCode.trim(); // JSContact uses "postcode"
      }
      if (contact.address.country && contact.address.country.trim()) {
        addressObj.country = contact.address.country.trim();
      }
      
      if (Object.keys(addressObj).length > 0) {
        jmapContact.addresses = { 'address-0': { ...addressObj, contexts: ['home'] } };
      }
    }

    // Notes
    if (contact.notes && contact.notes.trim()) {
      jmapContact.notes = contact.notes.trim();
    }

    // addressBookIds - RFC 9610 requires this to be an object/map: { "addressBookId": true }
    // This will be set by getOrCreateDefaultAddressBook() before creating the contact
    // For now, we'll add it in createContact() method

    return jmapContact;
  }

  /**
   * Get or create a default address book for contacts
   * RFC 9610: Contacts must belong to at least one address book
   */
  private async getOrCreateDefaultAddressBook(contactAccountId: string): Promise<string> {
    try {
      // First, try to get existing address books
      const response = await this.request([
        ['AddressBook/get', {
          accountId: contactAccountId,
        }, "0"]
      ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:contacts"]);

      const methodResponse = response.methodResponses?.[0];
      if (methodResponse && !methodResponse[0].endsWith('/error')) {
        const addressBooks = methodResponse[1].list || [];
        
        // Find default address book or use first one
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const defaultAddressBook = addressBooks.find((ab: any) => ab.isDefault) || addressBooks[0];
        if (defaultAddressBook) {
          return defaultAddressBook.id;
        }
      }

      // No address books found, create a default one
      const createResponse = await this.request([
        ['AddressBook/set', {
          accountId: contactAccountId,
          create: {
            'addressbook-default': {
              name: 'Default',
              isDefault: true
            }
          }
        }, "0"]
      ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:contacts"]);

      const createMethodResponse = createResponse.methodResponses?.[0];
      if (createMethodResponse && !createMethodResponse[0].endsWith('/error')) {
        const created = createMethodResponse[1].created as Record<string, { id: string }>;
        if (created && Object.keys(created).length > 0) {
          return Object.values(created)[0].id;
        }
      }

      throw new Error('Failed to create default address book');
    } catch (error) {
      console.error('Error getting/creating address book:', error);
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapJMAPContactToContact(jmapContact: any): Contact {
    const standard = this.getContactStandard();
    
    // Handle JSContact format (RFC 9553) - Stalwart uses this for JMAP
    if (standard === 'contacts' && (jmapContact.emails || jmapContact.phones || jmapContact.name || jmapContact.fullName)) {
      // Extract primary email from emails object/map
      const emailEntries = jmapContact.emails ? Object.values(jmapContact.emails) as Array<{ address: string }> : [];
      const primaryEmail = emailEntries[0]?.address || '';
      const allEmails = emailEntries.map((e: { address: string }) => e.address);

      // Extract primary phone from phones object/map
      const phoneEntries = jmapContact.phones ? Object.values(jmapContact.phones) as Array<{ number: string }> : [];
      const primaryPhone = phoneEntries[0]?.number || undefined;
      const allPhones = phoneEntries.map((p: { number: string }) => p.number);

      // Extract address from addresses object/map
      const addressEntries = jmapContact.addresses ? Object.values(jmapContact.addresses) : [];
      const addressObj = addressEntries[0] as Record<string, string> | undefined;

      // Extract organization from organizations array
      const company = jmapContact.organizations?.[0]?.name || undefined;

      // Extract job title from titles array
      const jobTitle = jmapContact.titles?.[0]?.name || undefined;

      // Extract name from nameComponents or name/fullName
      let name: string | undefined;
      let firstName: string | undefined;
      let lastName: string | undefined;
      
      if (jmapContact.nameComponents) {
        firstName = jmapContact.nameComponents.given;
        lastName = jmapContact.nameComponents.family;
        const nameParts: string[] = [];
        if (firstName) nameParts.push(firstName);
        if (lastName) nameParts.push(lastName);
        name = nameParts.length > 0 ? nameParts.join(' ') : undefined;
      } else {
        name = jmapContact.name || jmapContact.fullName || undefined;
      }

      return {
        id: jmapContact.id,
        name: name,
        firstName: firstName,
        lastName: lastName,
        email: primaryEmail,
        emails: allEmails.length > 1 ? allEmails : undefined,
        phone: primaryPhone,
        phones: allPhones.length > 1 ? allPhones : undefined,
        company: company,
        jobTitle: jobTitle,
        address: addressObj ? {
          street: addressObj.street || undefined,
          city: addressObj.locality || addressObj.city || undefined,
          state: addressObj.region || addressObj.state || undefined,
          postalCode: addressObj.postcode || addressObj.postalCode || undefined,
          country: addressObj.country || undefined,
        } : undefined,
        notes: jmapContact.notes || undefined,
        createdAt: jmapContact.createdAt || undefined,
        updatedAt: jmapContact.updatedAt || undefined,
      };
    }

    // Handle RFC 8621 (AddressBook) format
    return {
      id: jmapContact.id,
      firstName: jmapContact.firstName || undefined,
      lastName: jmapContact.lastName || undefined,
      name: jmapContact.name || undefined,
      email: jmapContact.email || '',
      emails: jmapContact.emails || undefined,
      phone: jmapContact.phone || undefined,
      phones: jmapContact.phones || undefined,
      company: jmapContact.company || undefined,
      jobTitle: jmapContact.jobTitle || undefined,
      address: jmapContact.address ? {
        street: jmapContact.address.street || undefined,
        city: jmapContact.address.city || undefined,
        state: jmapContact.address.state || undefined,
        postalCode: jmapContact.address.postalCode || undefined,
        country: jmapContact.address.country || undefined,
      } : undefined,
      notes: jmapContact.notes || undefined,
      createdAt: jmapContact.createdAt || undefined,
      updatedAt: jmapContact.updatedAt || undefined,
    };
  }

  // Calendar methods (JSCalendar - RFC 8984)
  private getCalendarAccountId(): string | null {
    if (!this.session) {
      return null;
    }
    // JSCalendar uses urn:ietf:params:jmap:calendars
    const calendarAccount = this.session.primaryAccounts?.["urn:ietf:params:jmap:calendars"];
    if (calendarAccount) {
      return calendarAccount;
    }
    // Fallback to mail account if not found
    return this.accountId;
  }

  supportsCalendars(): boolean {
    return this.hasCapability("urn:ietf:params:jmap:calendars");
  }

  async getCalendars(): Promise<Calendar[]> {
    if (!this.supportsCalendars()) {
      return [];
    }

    const calendarAccountId = this.getCalendarAccountId();
    if (!calendarAccountId) {
      return [];
    }

    try {
      const response = await this.request([
        ["Calendar/get", {
          accountId: calendarAccountId,
        }, "0"]
      ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:calendars"]);

      const responseMethod = response.methodResponses?.[0]?.[0];
      if (responseMethod === "Calendar/get") {
        const calendars = response.methodResponses[0][1].list || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return calendars.map((cal: any) => this.mapJMAPCalendarToCalendar(cal));
      }

      return [];
    } catch (error) {
      console.error('Failed to get calendars:', error);
      return [];
    }
  }

  async createCalendar(calendar: Omit<Calendar, 'id'>): Promise<string> {
    if (!this.supportsCalendars()) {
      throw new Error('Calendars not supported by server');
    }

    const calendarAccountId = this.getCalendarAccountId();
    if (!calendarAccountId) {
      throw new Error('No calendar account found');
    }

    const calendarId = `calendar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const jmapCalendar = this.mapCalendarToJMAPCalendar(calendar);

    console.log('Creating calendar with:', { 
      calendarAccountId, 
      jmapCalendar 
    });

    const response = await this.request([
      ["Calendar/set", {
        accountId: calendarAccountId,
        create: {
          [calendarId]: jmapCalendar
        },
      }, "0"]
    ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:calendars"]);

    const result = response.methodResponses[0][1];
    if (result.created && result.created[calendarId]) {
      return result.created[calendarId].id;
    }

    if (result.notCreated && result.notCreated[calendarId]) {
      const error = result.notCreated[calendarId];
      throw new Error(error.description || error.type || 'Failed to create calendar');
    }

    throw new Error('Failed to create calendar: unexpected response format');
  }

  async updateCalendar(id: string, calendar: Partial<Calendar>): Promise<void> {
    if (!this.supportsCalendars()) {
      throw new Error('Calendars not supported by server');
    }

    const calendarAccountId = this.getCalendarAccountId();
    if (!calendarAccountId) {
      throw new Error('No calendar account found');
    }

    const jmapCalendar = this.mapCalendarToJMAPCalendar(calendar, true);

    const response = await this.request([
      ["Calendar/set", {
        accountId: calendarAccountId,
        update: {
          [id]: jmapCalendar
        },
      }, "0"]
    ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:calendars"]);

    const result = response.methodResponses[0][1];
    if (result.notUpdated && result.notUpdated[id]) {
      const error = result.notUpdated[id];
      throw new Error(error.description || error.type || 'Failed to update calendar');
    }
  }

  async deleteCalendar(id: string): Promise<void> {
    if (!this.supportsCalendars()) {
      throw new Error('Calendars not supported by server');
    }

    const calendarAccountId = this.getCalendarAccountId();
    if (!calendarAccountId) {
      throw new Error('No calendar account found');
    }

    const response = await this.request([
      ["Calendar/set", {
        accountId: calendarAccountId,
        destroy: [id],
      }, "0"]
    ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:calendars"]);

    const result = response.methodResponses[0][1];
    if (result.notDestroyed && result.notDestroyed[id]) {
      const error = result.notDestroyed[id];
      throw new Error(error.description || error.type || 'Failed to delete calendar');
    }
  }

  async getEvents(calendarId?: string, start?: Date, end?: Date): Promise<CalendarEvent[]> {
    if (!this.supportsCalendars()) {
      return [];
    }

    const calendarAccountId = this.getCalendarAccountId();
    if (!calendarAccountId) {
      return [];
    }

    try {
      const filter: Record<string, unknown> = {};
      if (calendarId) {
        filter.inCalendar = calendarId;
      }
      if (start || end) {
        filter.after = start ? start.toISOString() : undefined;
        filter.before = end ? end.toISOString() : undefined;
      }

      const response = await this.request([
        ["CalendarEvent/query", {
          accountId: calendarAccountId,
          filter: Object.keys(filter).length > 0 ? filter : undefined,
        }, "0"]
      ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:calendars"]);

      const queryResult = response.methodResponses?.[0]?.[1];
      if (!queryResult || !queryResult.ids || queryResult.ids.length === 0) {
        return [];
      }

      // Fetch the actual events
      const getResponse = await this.request([
        ["CalendarEvent/get", {
          accountId: calendarAccountId,
          ids: queryResult.ids,
        }, "1"]
      ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:calendars"]);

      const getResult = getResponse.methodResponses?.[0]?.[1];
      if (getResult && getResult.list) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return getResult.list.map((event: any) => this.mapJMAPEventToEvent(event));
      }

      return [];
    } catch (error) {
      console.error('Failed to get events:', error);
      return [];
    }
  }

  /**
   * Get or create a default calendar for events
   * RFC 8984: Events must belong to at least one calendar
   */
  private async getOrCreateDefaultCalendar(calendarAccountId: string): Promise<string> {
    try {
      // First, try to get existing calendars
      const response = await this.request([
        ['Calendar/get', {
          accountId: calendarAccountId,
        }, "0"]
      ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:calendars"]);

      const methodResponse = response.methodResponses?.[0];
      if (methodResponse && !methodResponse[0].endsWith('/error')) {
        const calendars = methodResponse[1].list || [];
        
        // Find default calendar or use first one
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const defaultCalendar = calendars.find((cal: any) => cal.isDefault) || calendars[0];
        if (defaultCalendar) {
          return defaultCalendar.id;
        }
      }

      // No calendars found, create a default one
      const createResponse = await this.request([
        ['Calendar/set', {
          accountId: calendarAccountId,
          create: {
            'calendar-default': {
              name: 'Default',
              isDefault: true
            }
          }
        }, "0"]
      ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:calendars"]);

      const createMethodResponse = createResponse.methodResponses?.[0];
      if (createMethodResponse && !createMethodResponse[0].endsWith('/error')) {
        const created = createMethodResponse[1].created as Record<string, { id: string }>;
        if (created && Object.keys(created).length > 0) {
          return Object.values(created)[0].id;
        }
      }

      throw new Error('Failed to create default calendar');
    } catch (error) {
      console.error('Error getting/creating calendar:', error);
      throw error;
    }
  }

  async createEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!this.supportsCalendars()) {
      throw new Error('Calendars not supported by server');
    }

    const calendarAccountId = this.getCalendarAccountId();
    if (!calendarAccountId) {
      throw new Error('No calendar account found');
    }

    // Ensure event has a calendarId - use default if not provided
    if (!event.calendarId) {
      const defaultCalendarId = await this.getOrCreateDefaultCalendar(calendarAccountId);
      event.calendarId = defaultCalendarId;
    }

    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const jmapEvent = this.mapEventToJMAPEvent(event);

    console.log('Creating event with:', { 
      calendarAccountId, 
      jmapEvent 
    });

    const response = await this.request([
      ["CalendarEvent/set", {
        accountId: calendarAccountId,
        create: {
          [eventId]: jmapEvent
        },
      }, "0"]
    ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:calendars"]);

    const result = response.methodResponses[0][1];
    if (result.created && result.created[eventId]) {
      return result.created[eventId].id;
    }

    if (result.notCreated && result.notCreated[eventId]) {
      const error = result.notCreated[eventId];
      throw new Error(error.description || error.type || 'Failed to create event');
    }

    throw new Error('Failed to create event: unexpected response format');
  }

  async updateEvent(id: string, event: Partial<CalendarEvent>): Promise<void> {
    if (!this.supportsCalendars()) {
      throw new Error('Calendars not supported by server');
    }

    const calendarAccountId = this.getCalendarAccountId();
    if (!calendarAccountId) {
      throw new Error('No calendar account found');
    }

    const jmapEvent = this.mapEventToJMAPEvent(event, true);

    const response = await this.request([
      ["CalendarEvent/set", {
        accountId: calendarAccountId,
        update: {
          [id]: jmapEvent
        },
      }, "0"]
    ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:calendars"]);

    const result = response.methodResponses[0][1];
    if (result.notUpdated && result.notUpdated[id]) {
      const error = result.notUpdated[id];
      throw new Error(error.description || error.type || 'Failed to update event');
    }
  }

  async deleteEvent(id: string): Promise<void> {
    if (!this.supportsCalendars()) {
      throw new Error('Calendars not supported by server');
    }

    const calendarAccountId = this.getCalendarAccountId();
    if (!calendarAccountId) {
      throw new Error('No calendar account found');
    }

    const response = await this.request([
      ["CalendarEvent/set", {
        accountId: calendarAccountId,
        destroy: [id],
      }, "0"]
    ], ["urn:ietf:params:jmap:core", "urn:ietf:params:jmap:calendars"]);

    const result = response.methodResponses[0][1];
    if (result.notDestroyed && result.notDestroyed[id]) {
      const error = result.notDestroyed[id];
      throw new Error(error.description || error.type || 'Failed to delete event');
    }
  }

  // Mapping functions for JSCalendar format
  private mapCalendarToJMAPCalendar(calendar: Partial<Calendar>, _isUpdate: boolean = false): Record<string, unknown> {
    const jmapCalendar: Record<string, unknown> = {};

    // JSCalendar Calendar object structure
    if (calendar.name) {
      jmapCalendar.name = calendar.name;
    }
    if (calendar.description) {
      jmapCalendar.description = calendar.description;
    }
    if (calendar.color) {
      jmapCalendar.color = calendar.color;
    }
    if (calendar.timeZone) {
      jmapCalendar.timeZone = calendar.timeZone;
    }
    if (calendar.sortOrder !== undefined) {
      jmapCalendar.sortOrder = calendar.sortOrder;
    }
    if (calendar.isReadOnly !== undefined) {
      jmapCalendar.isReadOnly = calendar.isReadOnly;
    }

    return jmapCalendar;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapJMAPCalendarToCalendar(jmapCalendar: any): Calendar {
    return {
      id: jmapCalendar.id,
      name: jmapCalendar.name || '',
      description: jmapCalendar.description,
      color: jmapCalendar.color,
      timeZone: jmapCalendar.timeZone,
      sortOrder: jmapCalendar.sortOrder,
      isReadOnly: jmapCalendar.isReadOnly,
      accountId: jmapCalendar.accountId,
    };
  }

  private mapEventToJMAPEvent(event: Partial<CalendarEvent>, _isUpdate: boolean = false): Record<string, unknown> {
    const jmapEvent: Record<string, unknown> = {};

    // JSCalendar Event object structure
    if (event.calendarId) {
      jmapEvent.calendarIds = { [event.calendarId]: true }; // JSCalendar uses calendarIds object
    }
    if (event.title) {
      jmapEvent.title = event.title;
    }
    if (event.description) {
      jmapEvent.description = event.description;
    }
    if (event.start) {
      jmapEvent.start = event.start; // ISO 8601 date-time
    }
    if (event.end) {
      jmapEvent.end = event.end; // ISO 8601 date-time
    }
    if (event.allDay !== undefined) {
      jmapEvent.showWithoutTime = event.allDay; // JSCalendar uses showWithoutTime
    }
    if (event.location) {
      jmapEvent.locations = {
        'location-0': {
          name: event.location,
        }
      };
    }

    // Attendees - JSCalendar uses participants object
    if (event.attendees && event.attendees.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const participants: Record<string, any> = {};
      event.attendees.forEach((attendee, index) => {
        const participantId = `participant-${index}`;
        participants[participantId] = {
          name: attendee.name,
          email: attendee.email,
          kind: attendee.role === 'organizer' ? 'individual' : 'individual',
          roles: attendee.role === 'organizer' ? ['owner'] : [attendee.role || 'attendee'],
          participationStatus: attendee.status || 'needs-action',
        };
      });
      if (Object.keys(participants).length > 0) {
        jmapEvent.participants = participants;
      }
    }

    // Recurrence - JSCalendar uses recurrenceRules array
    if (event.recurrence) {
      const rule: Record<string, unknown> = {
        frequency: event.recurrence.frequency.toUpperCase(), // DAILY, WEEKLY, MONTHLY, YEARLY
      };
      if (event.recurrence.interval) {
        rule.interval = event.recurrence.interval;
      }
      if (event.recurrence.count) {
        rule.count = event.recurrence.count;
      }
      if (event.recurrence.until) {
        rule.until = event.recurrence.until;
      }
      if (event.recurrence.byDay && event.recurrence.byDay.length > 0) {
        rule.byDay = event.recurrence.byDay;
      }
      if (event.recurrence.byMonth && event.recurrence.byMonth.length > 0) {
        rule.byMonth = event.recurrence.byMonth;
      }
      if (event.recurrence.byMonthDay && event.recurrence.byMonthDay.length > 0) {
        rule.byMonthDay = event.recurrence.byMonthDay;
      }
      jmapEvent.recurrenceRules = [rule];
    }

    // Reminders/Alarms - JSCalendar uses useAlerts array
    if (event.reminders && event.reminders.length > 0) {
      const alerts: Array<Record<string, unknown>> = [];
      event.reminders.forEach((reminder) => {
        const alert: Record<string, unknown> = {
          trigger: {
            offset: `-PT${reminder.minutes}M`, // ISO 8601 duration
          },
        };
        if (reminder.method === 'display') {
          alert.action = 'display';
        } else if (reminder.method === 'email') {
          alert.action = 'email';
        } else if (reminder.method === 'sound') {
          alert.action = 'audio';
        }
        alerts.push(alert);
      });
      if (alerts.length > 0) {
        jmapEvent.useAlerts = alerts;
      }
    }

    return jmapEvent;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapJMAPEventToEvent(jmapEvent: any): CalendarEvent {
    // Extract calendar ID from calendarIds object
    const calendarIds = jmapEvent.calendarIds || {};
    const calendarId = Object.keys(calendarIds)[0] || '';

    // Extract location from locations object
    const locations = jmapEvent.locations || {};
    const location = Object.values(locations)[0] as { name?: string } | undefined;
    const locationName = location?.name;

    // Extract attendees from participants object
    const participants = jmapEvent.participants || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const attendees = Object.values(participants).map((p: any) => ({
      email: p.email || '',
      name: p.name,
      role: p.roles?.[0] === 'owner' ? 'organizer' : (p.roles?.[0] || 'optional') as 'organizer' | 'required' | 'optional',
      status: (p.participationStatus || 'needs-action') as 'accepted' | 'declined' | 'tentative' | 'needs-action',
    }));

    // Extract recurrence from recurrenceRules array
    const recurrenceRule = jmapEvent.recurrenceRules?.[0];
    const recurrence = recurrenceRule ? {
      frequency: (recurrenceRule.frequency?.toLowerCase() || 'daily') as 'daily' | 'weekly' | 'monthly' | 'yearly',
      interval: recurrenceRule.interval,
      count: recurrenceRule.count,
      until: recurrenceRule.until,
      byDay: recurrenceRule.byDay,
      byMonth: recurrenceRule.byMonth,
      byMonthDay: recurrenceRule.byMonthDay,
    } : undefined;

    // Extract reminders from useAlerts array
    const alerts = jmapEvent.useAlerts || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reminders = alerts.map((alert: any) => {
      const offset = alert.trigger?.offset || '';
      // Parse ISO 8601 duration like "-PT15M" to minutes
      const minutesMatch = offset.match(/-PT(\d+)M/);
      const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 15;
      
      let method: 'email' | 'display' | 'sound' = 'display';
      if (alert.action === 'email') {
        method = 'email';
      } else if (alert.action === 'audio') {
        method = 'sound';
      }

      return { method, minutes };
    });

    return {
      id: jmapEvent.id,
      calendarId: calendarId,
      title: jmapEvent.title || '',
      description: jmapEvent.description,
      start: jmapEvent.start || '',
      end: jmapEvent.end || '',
      allDay: jmapEvent.showWithoutTime || false,
      location: locationName,
      attendees: attendees.length > 0 ? attendees : undefined,
      recurrence: recurrence,
      reminders: reminders.length > 0 ? reminders : undefined,
      createdAt: jmapEvent.created || jmapEvent.createdAt,
      updatedAt: jmapEvent.updated || jmapEvent.updatedAt,
    };
  }
}