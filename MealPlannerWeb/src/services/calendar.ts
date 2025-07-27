import { 
  CalendarEvent, 
  CalendarEventType, 
  RecurrenceRule,
  MealPlanPreferences,
  Meal 
} from '../types';
import { firestore, auth } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';

class CalendarService {
  private readonly eventsCollection = 'calendarEvents';
  private readonly preferencesCollection = 'mealPlanPreferences';

  /**
   * Create or update a calendar event
   */
  async saveEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const eventId = event.externalCalendarId || `event_${Date.now()}`;
    const now = new Date();

    const eventData: CalendarEvent = {
      ...event,
      id: eventId,
      userId: user.uid,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(doc(firestore, this.eventsCollection, eventId), this.convertToFirestore(eventData));
    
    // If it's a recurring event, generate occurrences
    if (event.recurring) {
      await this.generateRecurringEvents(eventData);
    }

    return eventId;
  }

  /**
   * Get events for a date range
   */
  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const eventsQuery = query(
      collection(firestore, this.eventsCollection),
      where('userId', '==', user.uid),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(eventsQuery);
    return snapshot.docs.map(doc => this.convertFromFirestore(doc.data()));
  }

  /**
   * Get events for a specific date
   */
  async getEventsForDate(date: Date): Promise<CalendarEvent[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getEvents(startOfDay, endOfDay);
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    await deleteDoc(doc(firestore, this.eventsCollection, eventId));
  }

  /**
   * Update user's meal plan preferences
   */
  async updatePreferences(preferences: MealPlanPreferences): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    await setDoc(
      doc(firestore, this.preferencesCollection, user.uid), 
      this.convertPreferencesToFirestore(preferences)
    );
  }

  /**
   * Get user's meal plan preferences
   */
  async getPreferences(): Promise<MealPlanPreferences | null> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docSnap = await getDoc(doc(firestore, this.preferencesCollection, user.uid));
    
    if (docSnap.exists()) {
      return this.convertPreferencesFromFirestore(docSnap.data());
    }

    // Return default preferences
    return {
      userId: user.uid,
      defaultMealTimes: {
        breakfast: '08:00',
        lunch: '12:30',
        dinner: '18:30'
      },
      freshnessPreferences: {
        maxDaysForSeafood: 2,
        maxDaysForPoultry: 3,
        maxDaysForGroundMeat: 2,
        maxDaysForProduce: 5,
        preferFrozenForLaterDays: true
      }
    };
  }

  /**
   * Check if a meal should be skipped due to calendar events
   */
  async shouldSkipMeal(date: Date, mealType: 'breakfast' | 'lunch' | 'dinner'): Promise<boolean> {
    const events = await this.getEventsForDate(date);
    
    return events.some(event => {
      // Check if event affects all meals or specific meal
      if (!event.mealType || event.mealType === mealType) {
        // These event types mean we skip the meal
        return ['eating_out', 'ordering_in', 'travel', 'party'].includes(event.type);
      }
      return false;
    });
  }

  /**
   * Get meal modifications for a date (e.g., kids only, adults only)
   */
  async getMealModifications(date: Date): Promise<{
    kidsOnly: boolean;
    adultsOnly: boolean;
    busyDay: boolean;
  }> {
    const events = await this.getEventsForDate(date);
    
    return {
      kidsOnly: events.some(e => e.type === 'kids_only' || e.type === 'date_night'),
      adultsOnly: events.some(e => e.type === 'adults_only'),
      busyDay: events.some(e => e.type === 'busy_day')
    };
  }

  /**
   * Sync with external calendar (Google, Apple, Microsoft)
   */
  async syncWithExternalCalendar(
    calendarType: 'google' | 'apple' | 'microsoft',
    accessToken: string
  ): Promise<void> {
    // This would integrate with respective calendar APIs
    // For now, we'll implement a basic structure
    
    switch (calendarType) {
      case 'google':
        await this.syncWithGoogleCalendar(accessToken);
        break;
      case 'apple':
        await this.syncWithAppleCalendar(accessToken);
        break;
      case 'microsoft':
        await this.syncWithMicrosoftCalendar(accessToken);
        break;
    }
  }

  /**
   * Calculate optimal meal schedule based on freshness
   */
  calculateOptimalMealSchedule(
    meals: Meal[],
    weekStartDate: Date,
    preferences: MealPlanPreferences
  ): Map<string, Meal[]> {
    const schedule = new Map<string, Meal[]>();
    const freshness = preferences.freshnessPreferences;
    
    // Sort meals by freshness requirements (most perishable first)
    const sortedMeals = [...meals].sort((a, b) => {
      const aFreshness = this.getMealFreshnessScore(a, freshness);
      const bFreshness = this.getMealFreshnessScore(b, freshness);
      return aFreshness - bFreshness;
    });

    // Assign meals to days based on freshness
    let dayIndex = 0;
    sortedMeals.forEach(meal => {
      const date = new Date(weekStartDate);
      date.setDate(date.getDate() + dayIndex);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!schedule.has(dateKey)) {
        schedule.set(dateKey, []);
      }
      
      schedule.get(dateKey)!.push(meal);
      
      // Move to next day after 3 meals
      if (schedule.get(dateKey)!.length >= 3) {
        dayIndex++;
      }
    });

    return schedule;
  }

  /**
   * Generate recurring events
   */
  private async generateRecurringEvents(event: CalendarEvent): Promise<void> {
    if (!event.recurring) return;

    const occurrences: CalendarEvent[] = [];
    const { frequency, interval = 1, endDate, occurrences: maxOccurrences } = event.recurring;
    
    let currentDate = new Date(event.date);
    let count = 0;
    const maxDate = endDate || new Date(currentDate.getFullYear() + 1, currentDate.getMonth());

    while (currentDate <= maxDate && (!maxOccurrences || count < maxOccurrences)) {
      // Skip the first occurrence (already saved)
      if (count > 0) {
        const occurrence: CalendarEvent = {
          ...event,
          id: `${event.id}_${count}`,
          date: new Date(currentDate),
          recurring: undefined // Don't recurse
        };
        occurrences.push(occurrence);
      }

      // Calculate next occurrence
      switch (frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
      }
      
      count++;
    }

    // Save all occurrences
    for (const occurrence of occurrences) {
      await setDoc(
        doc(firestore, this.eventsCollection, occurrence.id), 
        this.convertToFirestore(occurrence)
      );
    }
  }

  /**
   * Get meal freshness score (lower = more perishable)
   */
  private getMealFreshnessScore(meal: Meal, freshness: MealPlanPreferences['freshnessPreferences']): number {
    const ingredients = meal.ingredients || [];
    let minFreshness = 10; // Default high freshness

    ingredients.forEach(ingredient => {
      const name = ingredient.name.toLowerCase();
      
      if (name.includes('seafood') || name.includes('fish') || name.includes('shrimp')) {
        minFreshness = Math.min(minFreshness, freshness.maxDaysForSeafood);
      } else if (name.includes('chicken') || name.includes('turkey')) {
        minFreshness = Math.min(minFreshness, freshness.maxDaysForPoultry);
      } else if (name.includes('ground') && (name.includes('beef') || name.includes('pork'))) {
        minFreshness = Math.min(minFreshness, freshness.maxDaysForGroundMeat);
      } else if (['lettuce', 'spinach', 'berries'].some(item => name.includes(item))) {
        minFreshness = Math.min(minFreshness, freshness.maxDaysForProduce);
      }
    });

    return minFreshness;
  }

  /**
   * Sync with Google Calendar
   */
  private async syncWithGoogleCalendar(accessToken: string): Promise<void> {
    // This would use Google Calendar API
    // For now, it's a placeholder
    console.log('Syncing with Google Calendar...');
    
    // Example structure:
    // 1. Fetch events from Google Calendar
    // 2. Convert to our CalendarEvent format
    // 3. Save to Firestore with externalCalendarId and externalCalendarType
  }

  /**
   * Sync with Apple Calendar
   */
  private async syncWithAppleCalendar(accessToken: string): Promise<void> {
    // This would use Apple Calendar API (EventKit for web)
    console.log('Syncing with Apple Calendar...');
  }

  /**
   * Sync with Microsoft Calendar
   */
  private async syncWithMicrosoftCalendar(accessToken: string): Promise<void> {
    // This would use Microsoft Graph API
    console.log('Syncing with Microsoft Calendar...');
  }

  /**
   * Convert to Firestore format
   */
  private convertToFirestore(event: CalendarEvent): any {
    return {
      ...event,
      date: Timestamp.fromDate(event.date),
      createdAt: Timestamp.fromDate(event.createdAt),
      updatedAt: Timestamp.fromDate(event.updatedAt)
    };
  }

  /**
   * Convert from Firestore format
   */
  private convertFromFirestore(data: any): CalendarEvent {
    return {
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    };
  }

  /**
   * Convert preferences to Firestore format
   */
  private convertPreferencesToFirestore(prefs: MealPlanPreferences): any {
    return {
      ...prefs,
      recurringEvents: prefs.recurringEvents?.map(event => this.convertToFirestore(event))
    };
  }

  /**
   * Convert preferences from Firestore format
   */
  private convertPreferencesFromFirestore(data: any): MealPlanPreferences {
    return {
      ...data,
      recurringEvents: data.recurringEvents?.map((event: any) => this.convertFromFirestore(event))
    };
  }
}

export const calendarService = new CalendarService(); 