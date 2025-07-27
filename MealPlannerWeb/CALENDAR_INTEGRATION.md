# Calendar Integration Guide

The Meal Planner now includes comprehensive calendar integration to make meal planning work with your real-life schedule.

## Overview

The calendar integration allows you to:
- Track when you're eating out, traveling, or have other plans
- Automatically adjust meal plans based on your schedule
- Optimize meal freshness by scheduling perishable items appropriately
- Sync with external calendars (Google, Apple, Microsoft) - coming soon
- Set recurring events (e.g., Pizza Friday, Date Night)

## Key Features

### 1. Event Types

The system supports various event types that affect meal planning:

- **Eating Out** - Restaurant visits, takeout
- **Date Night** - Adults only, kids need separate meals
- **Ordering In** - Pizza night, delivery
- **Travel** - Away from home
- **Party/Event** - Special events with food provided
- **Leftovers** - Using previous meals
- **Meal Prep** - Batch cooking days
- **Busy Day** - Need quick/easy meals
- **Kids Only** - Adults away
- **Adults Only** - Kids away
- **Custom** - Other events

### 2. Meal Adjustments

Based on calendar events, the system automatically:

- **Skips meals** when you're eating out or traveling
- **Adjusts portions** for kids-only or adults-only meals
- **Selects quick recipes** for busy days
- **Considers freshness** when scheduling meals

### 3. Freshness Optimization

The system schedules meals based on ingredient freshness:

- **Seafood**: Used within 2 days
- **Poultry**: Used within 3 days
- **Ground Meat**: Used within 2 days
- **Fresh Produce**: Used within 5 days
- **Frozen/Pantry**: Scheduled for later in the week

## How to Use

### Adding Calendar Events

1. **Navigate to Meal Plan page**
2. **Click on any date** in the calendar
3. **Select event type** from dropdown
4. **Specify affected meals** (all meals, or specific meal)
5. **Set as recurring** if it happens regularly
6. **Save the event**

### Viewing Your Schedule

The calendar shows:
- **Event badges** with icons and colors
- **Meal counts** for each day
- **Today highlighted** in blue

### Managing Events

- **Click on an event** to view details
- **Delete events** that are no longer needed
- **Recurring events** automatically populate future dates

## Implementation Details

### Data Structure

Calendar events are stored with:
```typescript
{
  id: string
  userId: string
  title: string
  type: CalendarEventType
  date: Date
  mealType?: 'breakfast' | 'lunch' | 'dinner'
  recurring?: RecurrenceRule
  notes?: string
}
```

### Meal Plan Generation

When generating meal plans:
1. System fetches calendar events for the week
2. Filters out meals for days with conflicting events
3. Applies meal modifications (kids-only, quick meals, etc.)
4. Optimizes meal order based on freshness preferences
5. Returns adjusted meal plan

### User Preferences

Users can set:
- Default meal times
- Freshness preferences for different ingredients
- Meal prep days
- Recurring events

## External Calendar Sync (Coming Soon)

Future updates will include:

### Google Calendar
- OAuth integration
- Two-way sync
- Automatic event detection

### Apple Calendar
- iCloud integration
- EventKit support
- iOS app sync

### Microsoft Outlook
- Microsoft Graph API
- Office 365 integration
- Exchange support

## Best Practices

1. **Add recurring events** for regular activities (weekly date night, pizza Friday)
2. **Mark travel dates** well in advance
3. **Use "Busy Day"** events to get quick meal suggestions
4. **Plan meal prep days** to batch cook for the week
5. **Update events** as plans change

## Privacy & Security

- Calendar data is stored securely in Firestore
- Only you can access your calendar events
- External calendar sync will use OAuth for security
- No calendar data is shared with third parties

## Troubleshooting

### Events not affecting meal plan
- Ensure events are saved for the correct dates
- Check that meal type selection matches
- Regenerate meal plan after adding events

### Freshness optimization not working
- Update your freshness preferences in settings
- Ensure ingredients are properly categorized
- Check that meal plan generation is using latest preferences

### Calendar not loading
- Check internet connection
- Ensure you're logged in
- Clear browser cache if issues persist 