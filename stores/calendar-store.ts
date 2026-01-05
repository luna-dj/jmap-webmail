import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Calendar, CalendarEvent } from "@/lib/jmap/types";
import { JMAPClient } from "@/lib/jmap/client";
import { useAuthStore } from "@/stores/auth-store";

interface CalendarStore {
  calendars: Calendar[];
  events: CalendarEvent[];
  selectedCalendar: Calendar | null;
  selectedEvent: CalendarEvent | null;
  view: 'month' | 'week' | 'day' | 'agenda';
  currentDate: Date;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Calendar CRUD operations
  addCalendar: (calendar: Omit<Calendar, 'id'>) => Promise<Calendar>;
  updateCalendar: (id: string, calendar: Partial<Calendar>) => Promise<void>;
  deleteCalendar: (id: string) => Promise<void>;
  getCalendar: (id: string) => Calendar | null;

  // Event CRUD operations
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEvent: (id: string) => CalendarEvent | null;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getEventsForCalendar: (calendarId: string) => CalendarEvent[];

  // JMAP sync operations
  syncCalendars: (client: JMAPClient | null) => Promise<void>;
  syncEvents: (client: JMAPClient | null, calendarId?: string) => Promise<void>;
  fetchCalendars: (client: JMAPClient | null) => Promise<void>;
  fetchEvents: (client: JMAPClient | null, calendarId?: string, start?: Date, end?: Date) => Promise<void>;

  // UI state
  setSelectedCalendar: (calendar: Calendar | null) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  setView: (view: 'month' | 'week' | 'day' | 'agenda') => void;
  setCurrentDate: (date: Date) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  navigateDate: (direction: 'prev' | 'next' | 'today') => void;
}

const generateId = () => `calendar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateEventId = () => `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      calendars: [],
      events: [],
      selectedCalendar: null,
      selectedEvent: null,
      view: 'month',
      currentDate: new Date(),
      searchQuery: "",
      isLoading: false,
      error: null,

      addCalendar: async (calendarData) => {
        // Try to save to JMAP if client is available
        const client = useAuthStore.getState().client;
        let calendarId: string;
        
        if (client && client.supportsCalendars()) {
          try {
            calendarId = await client.createCalendar(calendarData);
          } catch (error) {
            console.error('Failed to save calendar to JMAP, using local ID:', error);
            calendarId = generateId();
          }
        } else {
          calendarId = generateId();
        }

        const calendar: Calendar = {
          id: calendarId,
          ...calendarData,
        };

        set((state) => ({
          calendars: [...state.calendars, calendar],
        }));

        return calendar;
      },

      updateCalendar: async (id, updates) => {
        // Try to update on JMAP server if client is available
        const client = useAuthStore.getState().client;
        if (client && client.supportsCalendars()) {
          try {
            await client.updateCalendar(id, updates);
          } catch (error) {
            console.error('Failed to update calendar on JMAP:', error);
            // Continue with local update anyway
          }
        }

        set((state) => ({
          calendars: state.calendars.map((calendar) =>
            calendar.id === id ? { ...calendar, ...updates } : calendar
          ),
        }));
      },

      deleteCalendar: async (id) => {
        // Try to delete from JMAP server if client is available
        const client = useAuthStore.getState().client;
        if (client && client.supportsCalendars()) {
          try {
            await client.deleteCalendar(id);
          } catch (error) {
            console.error('Failed to delete calendar from JMAP:', error);
            // Continue with local deletion anyway
          }
        }

        // Delete all events for this calendar
        set((state) => ({
          events: state.events.filter((event) => event.calendarId !== id),
        }));

        // Delete the calendar
        set((state) => ({
          calendars: state.calendars.filter((calendar) => calendar.id !== id),
          selectedCalendar: state.selectedCalendar?.id === id ? null : state.selectedCalendar,
        }));
      },

      getCalendar: (id) => {
        const { calendars } = get();
        return calendars.find((calendar) => calendar.id === id) || null;
      },

      addEvent: async (eventData) => {
        // Try to save to JMAP if client is available
        const client = useAuthStore.getState().client;
        let eventId: string;
        const now = new Date().toISOString();
        
        if (client && client.supportsCalendars()) {
          try {
            eventId = await client.createEvent(eventData);
          } catch (error) {
            console.error('Failed to save event to JMAP, using local ID:', error);
            eventId = generateEventId();
          }
        } else {
          eventId = generateEventId();
        }

        const event: CalendarEvent = {
          id: eventId,
          ...eventData,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          events: [...state.events, event],
        }));

        return event;
      },

      updateEvent: async (id, updates) => {
        // Try to update on JMAP server if client is available
        const client = useAuthStore.getState().client;
        if (client && client.supportsCalendars()) {
          try {
            await client.updateEvent(id, updates);
          } catch (error) {
            console.error('Failed to update event on JMAP:', error);
            // Continue with local update anyway
          }
        }

        set((state) => ({
          events: state.events.map((event) =>
            event.id === id
              ? { ...event, ...updates, updatedAt: new Date().toISOString() }
              : event
          ),
        }));
      },

      deleteEvent: async (id) => {
        // Try to delete from JMAP server if client is available
        const client = useAuthStore.getState().client;
        if (client && client.supportsCalendars()) {
          try {
            await client.deleteEvent(id);
          } catch (error) {
            console.error('Failed to delete event from JMAP:', error);
            // Continue with local deletion anyway
          }
        }

        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
          selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
        }));
      },

      getEvent: (id) => {
        const { events } = get();
        return events.find((event) => event.id === id) || null;
      },

      getEventsForDate: (date) => {
        const { events } = get();
        const dateStr = date.toISOString().split('T')[0];
        return events.filter((event) => {
          const eventStart = new Date(event.start).toISOString().split('T')[0];
          return eventStart === dateStr;
        });
      },

      getEventsForCalendar: (calendarId) => {
        const { events } = get();
        return events.filter((event) => event.calendarId === calendarId);
      },

      syncCalendars: async (client) => {
        if (!client) return;
        try {
          await get().fetchCalendars(client);
        } catch (error) {
          console.error('Failed to sync calendars:', error);
        }
      },

      syncEvents: async (client, calendarId) => {
        if (!client) return;
        try {
          await get().fetchEvents(client, calendarId);
        } catch (error) {
          console.error('Failed to sync events:', error);
        }
      },

      fetchCalendars: async (client) => {
        if (!client) return;
        try {
          if (client.supportsCalendars()) {
            const calendars = await client.getCalendars();
            set({ calendars });
          }
        } catch (error) {
          console.error('Failed to fetch calendars:', error);
        }
      },

      fetchEvents: async (client, calendarId, start, end) => {
        if (!client) return;
        try {
          if (client.supportsCalendars()) {
            const events = await client.getEvents(calendarId, start, end);
            // Merge with existing events, avoiding duplicates
            set((state) => {
              const existingIds = new Set(state.events.map(e => e.id));
              const newEvents = events.filter(e => !existingIds.has(e.id));
              return {
                events: [...state.events, ...newEvents],
              };
            });
          }
        } catch (error) {
          console.error('Failed to fetch events:', error);
        }
      },

      setSelectedCalendar: (calendar) => set({ selectedCalendar: calendar }),
      setSelectedEvent: (event) => set({ selectedEvent: event }),
      setView: (view) => set({ view }),
      setCurrentDate: (date) => set({ currentDate: date }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      navigateDate: (direction) => {
        const { currentDate, view } = get();
        const newDate = new Date(currentDate);

        if (direction === 'today') {
          set({ currentDate: new Date() });
        } else if (direction === 'prev') {
          if (view === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
          } else if (view === 'week') {
            newDate.setDate(newDate.getDate() - 7);
          } else {
            newDate.setDate(newDate.getDate() - 1);
          }
          set({ currentDate: newDate });
        } else if (direction === 'next') {
          if (view === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
          } else if (view === 'week') {
            newDate.setDate(newDate.getDate() + 7);
          } else {
            newDate.setDate(newDate.getDate() + 1);
          }
          set({ currentDate: newDate });
        }
      },
    }),
    {
      name: 'calendar-storage',
      partialize: (state) => ({
        calendars: state.calendars,
        events: state.events,
        view: state.view,
      }),
    }
  )
);
