"use client";

import { useCalendarStore } from "@/stores/calendar-store";
import { CalendarEvent } from "@/lib/jmap/types";
import { cn } from "@/lib/utils";

interface CalendarMonthViewProps {
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

export function CalendarMonthView({ onEventClick, onDateClick }: CalendarMonthViewProps) {
  const { currentDate, getEventsForDate } = useCalendarStore();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Generate calendar days
  const days: (Date | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="border-r border-b" />;
          }

          const events = getEventsForDate(date);
          const isCurrentMonth = date.getMonth() === month;

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "border-r border-b p-2 min-h-[100px] cursor-pointer hover:bg-muted/50 transition-colors",
                !isCurrentMonth && "bg-muted/20",
                isToday(date) && "bg-primary/10"
              )}
              onClick={() => onDateClick(date)}
            >
              <div className={cn(
                "text-sm font-medium mb-1",
                isToday(date) && "text-primary font-bold"
              )}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded truncate cursor-pointer hover:bg-primary/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{events.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
