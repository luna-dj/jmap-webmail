/**
 * Integration layer for jmap-js library
 * 
 * This module loads Overture and jmap-js libraries and provides
 * TypeScript-friendly access to them.
 * 
 * Based on: https://github.com/jmapio/jmap-js
 */

// Declare global types for Overture and JMAP
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    O: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JMAP: any;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var O: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var JMAP: any;
}

/**
 * Loads Overture library
 */
export async function loadOverture(): Promise<void> {
  if (typeof window !== 'undefined' && window.O) {
    return; // Already loaded
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Overture can only be loaded in browser environment'));
      return;
    }

    const script = document.createElement('script');
    script.src = '/lib/overture/dist/O.js';
    script.onload = () => {
      // Make O available globally
      if (window.O) {
        resolve();
      } else {
        reject(new Error('Overture failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Overture'));
    document.head.appendChild(script);
  });
}

/**
 * Loads jmap-js library
 */
export async function loadJMAPJS(): Promise<void> {
  if (typeof window !== 'undefined' && window.JMAP) {
    return; // Already loaded
  }

  // First ensure Overture is loaded
  await loadOverture();

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('jmap-js can only be loaded in browser environment'));
      return;
    }

    const script = document.createElement('script');
    script.src = '/lib/jmap-js/build/JMAP.js';
    script.onload = () => {
      // Make JMAP available globally
      if (window.JMAP) {
        resolve();
      } else {
        reject(new Error('jmap-js failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load jmap-js'));
    document.head.appendChild(script);
  });
}

/**
 * Initialize jmap-js with authentication data
 * 
 * @param authData Authentication data from JMAP session
 */
export async function initializeJMAPJS(authData: {
  username: string;
  accessToken?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  accounts: Record<string, any>;
  apiUrl: string;
  downloadUrl: string;
  uploadUrl?: string;
  eventSourceUrl?: string;
}): Promise<void> {
  await loadJMAPJS();

  if (typeof window === 'undefined' || !window.JMAP) {
    throw new Error('jmap-js not loaded');
  }

  // For Basic Auth, we need to handle it differently
  // jmap-js expects accessToken, but we're using Basic Auth
  // We'll need to adapt the connection to use Basic Auth headers
  
  window.JMAP.auth.didAuthenticate({
    username: authData.username,
    accessToken: authData.accessToken || '', // May need to adapt for Basic Auth
    accounts: authData.accounts,
    apiUrl: authData.apiUrl,
    downloadUrl: authData.downloadUrl,
    uploadUrl: authData.uploadUrl,
    eventSourceUrl: authData.eventSourceUrl,
  });
}

/**
 * Get JMAP store instance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getJMAPStore(): any {
  if (typeof window === 'undefined' || !window.JMAP) {
    throw new Error('jmap-js not loaded. Call loadJMAPJS() first.');
  }
  return window.JMAP.store;
}

/**
 * Get JMAP contacts helper
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getJMAPContacts(): any {
  if (typeof window === 'undefined' || !window.JMAP) {
    throw new Error('jmap-js not loaded. Call loadJMAPJS() first.');
  }
  return window.JMAP.contacts;
}

/**
 * Get JMAP mail helper
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getJMAPMail(): any {
  if (typeof window === 'undefined' || !window.JMAP) {
    throw new Error('jmap-js not loaded. Call loadJMAPJS() first.');
  }
  return window.JMAP.mail;
}

/**
 * Get JMAP calendar helper
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getJMAPCalendar(): any {
  if (typeof window === 'undefined' || !window.JMAP) {
    throw new Error('jmap-js not loaded. Call loadJMAPJS() first.');
  }
  return window.JMAP.calendar;
}

/**
 * Check if jmap-js is loaded
 */
export function isJMAPJSLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.JMAP;
}

/**
 * Check if Overture is loaded
 */
export function isOvertureLoaded(): boolean {
  return typeof window !== 'undefined' && !!window.O;
}
