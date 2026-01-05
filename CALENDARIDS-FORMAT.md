# calendarIds Format Investigation

## Summary

Similar to `addressBookIds` for contacts, `calendarIds` for calendar events also uses an object/map format, not an array.

## Correct Format

According to **RFC 8984 (JSCalendar)** and **RFC 8984 (JMAP Calendars)**:

**✅ CORRECT** (Object/Map format):
```json
{
  "calendarIds": {
    "b": true
  }
}
```

**❌ WRONG** (Array format):
```json
{
  "calendarIds": ["b"]
}
```

## Implementation

The client code already had the correct format implemented at line 2640:

```typescript
jmapEvent.calendarIds = { [event.calendarId]: true };
```

### Code Changes

1. **Added `getOrCreateDefaultCalendar()` method** in `JMAPClient`:
   - Fetches existing calendars
   - Uses default calendar if available (`isDefault: true`)
   - Creates a new default calendar if none exists

2. **Updated `createEvent()` method**:
   - Automatically gets/creates default calendar if `event.calendarId` is not provided
   - Ensures events always have a calendar to belong to

### Test Results

✅ Calendar event creation works successfully:
```json
{
  "@type": "Event",
  "uid": "test-event-...@example.com",
  "title": "Test Calendar Event",
  "calendarIds": {
    "b": true
  },
  "start": "2026-01-05T13:00:00.000Z",
  "duration": "PT1H"
}
```

### Key Points

1. **calendarIds is an object, not an array** - same pattern as addressBookIds
2. **Values must be `true`** - not just any boolean
3. **Events MUST belong to at least one calendar** - similar to contacts and address books
4. **Default calendar** should be used when available (`isDefault: true`)
5. **Method name is `CalendarEvent/set`** - not `Event/set`

### Method Names

- **Calendars**: `Calendar/get`, `Calendar/set`
- **Calendar Events**: `CalendarEvent/get`, `CalendarEvent/set`, `CalendarEvent/query`

### References

- RFC 8984: JSCalendar - A JSON Representation of Calendar Data
- RFC 8984: JMAP Calendars
- Stalwart Mail Server implementation
