"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CalendarMonthView } from "@/components/calendar/calendar-month-view";
import { CalendarEventForm } from "@/components/calendar/calendar-event-form";
import { useCalendarStore } from "@/stores/calendar-store";
import { useAuthStore } from "@/stores/auth-store";
import { CalendarEvent } from "@/lib/jmap/types";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, ArrowLeft } from "lucide-react";

export default function CalendarPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations('calendar');
  const tSettings = useTranslations('settings');
  const { client } = useAuthStore();
  const { 
    currentDate, 
    navigateDate, 
    selectedEvent, 
    setSelectedEvent, 
    deleteEvent,
    calendars,
    addCalendar,
    fetchCalendars,
    fetchEvents
  } = useCalendarStore();

  // Fetch calendars when page loads
  useEffect(() => {
    if (client) {
      fetchCalendars(client);
    }
  }, [client, fetchCalendars]);

  // Fetch events when calendars are loaded
  useEffect(() => {
    if (client && calendars.length > 0) {
      // Fetch events for the current month view
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      fetchEvents(client, undefined, start, end);
    }
  }, [client, calendars.length, currentDate, fetchEvents]);

  // Initialize default calendar if none exists (only if no JMAP support)
  useEffect(() => {
    if (calendars.length === 0 && (!client || !client.supportsCalendars())) {
      addCalendar({
        name: t('default_calendar_name'),
        description: t('default_calendar_description'),
        color: '#3b82f6',
      });
    }
  }, [calendars.length, client, addCalendar, t]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthNames = [
    t('january'), t('february'), t('march'), t('april'), t('may'), t('june'),
    t('july'), t('august'), t('september'), t('october'), t('november'), t('december')
  ];

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleNewEvent = () => {
    setEditingEvent(null);
    setSelectedDate(new Date());
    setShowEventForm(true);
  };

  const handleEditEvent = () => {
    if (selectedEvent) {
      setEditingEvent(selectedEvent);
      setShowEventForm(true);
    }
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && window.confirm(t('delete_confirm', { title: selectedEvent.title }))) {
      await deleteEvent(selectedEvent.id);
      setSelectedEvent(null);
    }
  };

  const handleSaveEvent = () => {
    setShowEventForm(false);
    setEditingEvent(null);
    setSelectedDate(null);
    setSelectedEvent(null);
  };

  const handleCancelForm = () => {
    setShowEventForm(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main Calendar View */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="mb-3">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigateDate('today')}>
                  {t('today')}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleNewEvent}>
                <Plus className="w-4 h-4 mr-2" />
                {t('new_event')}
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {showEventForm ? (
          <div className="flex-1 overflow-hidden">
            <CalendarEventForm
              event={editingEvent}
              initialDate={selectedDate || undefined}
              onSave={handleSaveEvent}
              onCancel={handleCancelForm}
            />
          </div>
        ) : selectedEvent ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">{selectedEvent.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedEvent.start).toLocaleString()} - {new Date(selectedEvent.end).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleEditEvent}>
                    {t('edit')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDeleteEvent}>
                    {t('delete')}
                  </Button>
                </div>
              </div>

              {selectedEvent.location && (
                <div>
                  <h3 className="font-semibold text-sm mb-1">{t('location')}</h3>
                  <p className="text-sm">{selectedEvent.location}</p>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <h3 className="font-semibold text-sm mb-1">{t('description')}</h3>
                  <p className="text-sm whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <CalendarMonthView
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}
