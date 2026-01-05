"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useCalendarStore } from "@/stores/calendar-store";
import { CalendarEvent } from "@/lib/jmap/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEventFormProps {
  event?: CalendarEvent | null;
  initialDate?: Date;
  onSave: () => void;
  onCancel: () => void;
}

export function CalendarEventForm({ event, initialDate, onSave, onCancel }: CalendarEventFormProps) {
  const t = useTranslations('calendar');
  const { addEvent, updateEvent, calendars, selectedCalendar } = useCalendarStore();

  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    start: event?.start || (initialDate ? initialDate.toISOString().slice(0, 16) : ''),
    end: event?.end || (initialDate ? new Date(initialDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) : ''),
    allDay: event?.allDay || false,
    location: event?.location || '',
    calendarId: event?.calendarId || selectedCalendar?.id || calendars[0]?.id || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        start: event.start ? new Date(event.start).toISOString().slice(0, 16) : '',
        end: event.end ? new Date(event.end).toISOString().slice(0, 16) : '',
        allDay: event.allDay || false,
        location: event.location || '',
        calendarId: event.calendarId || '',
      });
    }
  }, [event]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('title_required');
    }

    if (!formData.start) {
      newErrors.start = t('start_required');
    }

    if (!formData.end) {
      newErrors.end = t('end_required');
    }

    if (formData.start && formData.end && new Date(formData.start) >= new Date(formData.end)) {
      newErrors.end = t('end_after_start');
    }

    if (!formData.calendarId) {
      newErrors.calendarId = t('calendar_required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
        calendarId: formData.calendarId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        start: new Date(formData.start).toISOString(),
        end: new Date(formData.end).toISOString(),
        allDay: formData.allDay,
        location: formData.location.trim() || undefined,
      };

      if (event) {
        await updateEvent(event.id, eventData);
      } else {
        await addEvent(eventData);
      }

      onSave();
    } catch (error) {
      console.error('Failed to save event:', error);
      setErrors({ submit: t('save_error') });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {t('title')} <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t('title_placeholder')}
            className={cn(errors.title && "border-red-500")}
            required
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">
            {t('calendar')} <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.calendarId}
            onChange={(e) => setFormData({ ...formData, calendarId: e.target.value })}
            className={cn(
              "w-full p-2 border rounded-md outline-none",
              errors.calendarId && "border-red-500"
            )}
            required
          >
            <option value="">{t('select_calendar')}</option>
            {calendars.map((calendar) => (
              <option key={calendar.id} value={calendar.id}>
                {calendar.name}
              </option>
            ))}
          </select>
          {errors.calendarId && <p className="text-xs text-red-500 mt-1">{errors.calendarId}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              {t('start')} <span className="text-red-500">*</span>
            </label>
            <Input
              type={formData.allDay ? "date" : "datetime-local"}
              value={formData.start}
              onChange={(e) => setFormData({ ...formData, start: e.target.value })}
              className={cn(errors.start && "border-red-500")}
              required
            />
            {errors.start && <p className="text-xs text-red-500 mt-1">{errors.start}</p>}
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              {t('end')} <span className="text-red-500">*</span>
            </label>
            <Input
              type={formData.allDay ? "date" : "datetime-local"}
              value={formData.end}
              onChange={(e) => setFormData({ ...formData, end: e.target.value })}
              className={cn(errors.end && "border-red-500")}
              required
            />
            {errors.end && <p className="text-xs text-red-500 mt-1">{errors.end}</p>}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.allDay}
              onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
            />
            <span className="text-sm">{t('all_day')}</span>
          </label>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{t('location')}</label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder={t('location_placeholder')}
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1 block">{t('description')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('description_placeholder')}
            className="w-full min-h-[100px] p-3 border rounded-md resize-none outline-none text-sm"
            rows={4}
          />
        </div>

        {errors.submit && (
          <div className="text-sm text-red-500">{errors.submit}</div>
        )}
      </div>

      <div className="p-4 border-t flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          {t('cancel')}
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
