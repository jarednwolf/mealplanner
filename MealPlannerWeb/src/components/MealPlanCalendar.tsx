import React, { useState, useEffect } from 'react';
import { 
  CalendarEvent, 
  CalendarEventType, 
  MealPlan 
} from '../types';
import { calendarService } from '../services/calendar';
import {
  CalendarIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon,
  UsersIcon,
  ShoppingBagIcon,
  MapPinIcon,
  CakeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface MealPlanCalendarProps {
  mealPlan: MealPlan | null;
  onEventAdded?: () => void;
  onDateClick?: (date: Date) => void;
}

const eventTypeConfig: Record<CalendarEventType, { 
  label: string; 
  icon: React.ComponentType<any>; 
  color: string;
  description: string;
}> = {
  eating_out: { 
    label: 'Eating Out', 
    icon: ShoppingBagIcon, 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Restaurant, takeout, or delivery'
  },
  date_night: { 
    label: 'Date Night', 
    icon: UsersIcon, 
    color: 'bg-pink-100 text-pink-800 border-pink-200',
    description: 'Adults only - kids need separate meal'
  },
  ordering_in: { 
    label: 'Ordering In', 
    icon: ShoppingBagIcon, 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: 'Pizza night, delivery, etc.'
  },
  travel: { 
    label: 'Travel', 
    icon: MapPinIcon, 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Away from home'
  },
  party: { 
    label: 'Party/Event', 
    icon: CakeIcon, 
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Special event with food provided'
  },
  leftovers: { 
    label: 'Leftovers', 
    icon: ArrowPathIcon, 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Using leftover meals'
  },
  meal_prep: { 
    label: 'Meal Prep', 
    icon: ClockIcon, 
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Batch cooking day'
  },
  busy_day: { 
    label: 'Busy Day', 
    icon: ClockIcon, 
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: 'Need quick/easy meals'
  },
  kids_only: { 
    label: 'Kids Only', 
    icon: UsersIcon, 
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Adults away - simple kids meals'
  },
  adults_only: { 
    label: 'Adults Only', 
    icon: UsersIcon, 
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Kids away - adult preferences'
  },
  custom: { 
    label: 'Custom Event', 
    icon: CalendarIcon, 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Other event affecting meals'
  }
};

const MealPlanCalendar: React.FC<MealPlanCalendarProps> = ({ 
  mealPlan, 
  onEventAdded,
  onDateClick 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Event form state
  const [eventForm, setEventForm] = useState({
    title: '',
    type: 'eating_out' as CalendarEventType,
    mealType: 'all' as 'all' | 'breakfast' | 'lunch' | 'dinner',
    recurring: false,
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    notes: ''
  });

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const monthEvents = await calendarService.getEvents(startOfMonth, endOfMonth);
      setEvents(monthEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowEventModal(true);
    onDateClick?.(date);
  };

  const handleSaveEvent = async () => {
    if (!selectedDate || !eventForm.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: '', // Will be set by service
        title: eventForm.title,
        type: eventForm.type,
        date: selectedDate,
        mealType: eventForm.mealType === 'all' ? undefined : eventForm.mealType,
        allDay: true,
        notes: eventForm.notes,
        recurring: eventForm.recurring ? {
          frequency: eventForm.frequency,
          endDate: new Date(selectedDate.getFullYear() + 1, selectedDate.getMonth(), selectedDate.getDate())
        } : undefined
      };

      await calendarService.saveEvent(event);
      toast.success('Event saved successfully');
      
      setShowEventModal(false);
      resetForm();
      loadEvents();
      onEventAdded?.();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    }
  };



  const resetForm = () => {
    setEventForm({
      title: '',
      type: 'eating_out',
      mealType: 'all',
      recurring: false,
      frequency: 'weekly',
      notes: ''
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getMealsForDate = (date: Date) => {
    if (!mealPlan) return [];
    
    // Get the week start date from the meal plan
    const planStartDate = new Date(mealPlan.weekStartDate);
    const planEndDate = new Date(planStartDate);
    planEndDate.setDate(planStartDate.getDate() + 6); // Add 6 days to get end of week
    
    // Check if the date is within the meal plan week
    if (date < planStartDate || date > planEndDate) {
      return [];
    }
    
    const dayOfWeek = date.getDay();
    return mealPlan.meals.filter(meal => meal.dayOfWeek === dayOfWeek);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          
          <h2 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRightIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Legend */}
        {mealPlan && (
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-50 border border-green-200 rounded"></div>
              <span>Meal Plan Week ({new Date(mealPlan.weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {(() => {
                const endDate = new Date(mealPlan.weekStartDate);
                endDate.setDate(endDate.getDate() + 6);
                return endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              })()})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
              <span>Today</span>
            </div>
          </div>
        )}
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-0 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-0">
        {getDaysInMonth().map((date, index) => {
          const isInMealPlanWeek = date && mealPlan && (() => {
            const planStartDate = new Date(mealPlan.weekStartDate);
            const planEndDate = new Date(planStartDate);
            planEndDate.setDate(planStartDate.getDate() + 6);
            return date >= planStartDate && date <= planEndDate;
          })();
          
          return (
            <div
              key={index}
              className={`
                min-h-24 border-r border-b p-2 
                ${date ? 'cursor-pointer hover:bg-gray-50' : ''}
                ${date && isToday(date) ? 'bg-blue-50' : ''}
                ${isInMealPlanWeek ? 'bg-green-50' : ''}
              `}
              onClick={() => date && handleDateClick(date)}
            >
            {date && (
              <>
                <div className="text-sm font-medium mb-1">
                  {date.getDate()}
                </div>
                
                {/* Events for this date */}
                <div className="space-y-1">
                  {getEventsForDate(date).slice(0, 2).map(event => {
                    const config = eventTypeConfig[event.type];
                    const Icon = config.icon;
                    return (
                      <div
                        key={event.id}
                        className={`text-xs px-1 py-0.5 rounded flex items-center gap-1 ${config.color} border`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Could open event details
                        }}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="truncate">{event.title}</span>
                      </div>
                    );
                  })}
                  
                  {getEventsForDate(date).length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{getEventsForDate(date).length - 2} more
                    </div>
                  )}
                  
                  {/* Meal count for this date */}
                  {getMealsForDate(date).length > 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      {getMealsForDate(date).length} meals planned
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          );
        })}
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Add Event - {selectedDate?.toLocaleDateString()}
              </h3>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  value={eventForm.type}
                  onChange={(e) => {
                    const type = e.target.value as CalendarEventType;
                    setEventForm({ 
                      ...eventForm, 
                      type,
                      title: eventTypeConfig[type].label 
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {Object.entries(eventTypeConfig).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label} - {config.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Dinner at Mario's"
                />
              </div>

              {/* Affected Meals */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affected Meals
                </label>
                <select
                  value={eventForm.mealType}
                  onChange={(e) => setEventForm({ ...eventForm, mealType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Meals</option>
                  <option value="breakfast">Breakfast Only</option>
                  <option value="lunch">Lunch Only</option>
                  <option value="dinner">Dinner Only</option>
                </select>
              </div>

              {/* Recurring */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={eventForm.recurring}
                    onChange={(e) => setEventForm({ ...eventForm, recurring: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Recurring Event
                  </span>
                </label>
                
                {eventForm.recurring && (
                  <select
                    value={eventForm.frequency}
                    onChange={(e) => setEventForm({ ...eventForm, frequency: e.target.value as any })}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={eventForm.notes}
                  onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={2}
                  placeholder="Any additional details..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEventModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEvent}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanCalendar; 