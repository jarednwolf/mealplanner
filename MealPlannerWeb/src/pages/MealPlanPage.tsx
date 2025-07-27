import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { mealPlanService } from '../services/mealPlan';
import { feedbackService } from '../services/feedback';
import { MealPlan, Meal, MealFeedback } from '../types';
import {
  ShoppingCartIcon,
  CalendarIcon,
  CheckIcon,
  ChatBubbleLeftIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  BoltIcon,
  ArrowPathIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  HandThumbUpIcon as ThumbUpSolid,
  HandThumbDownIcon as ThumbDownSolid,
  StarIcon as StarSolid
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import MealFeedbackModal from '../components/MealFeedbackModal';
import MealPlanCalendar from '../components/MealPlanCalendar';

const MealPlanPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [swappingMealId, setSwappingMealId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [weeklyBudget, setWeeklyBudget] = useState<number>(userProfile?.weeklyBudget || 200);
  const [viewMode, setViewMode] = useState<'calendar' | 'cards'>('cards');
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; meal: Meal | null }>({
    isOpen: false,
    meal: null
  });
  const [mealFeedback, setMealFeedback] = useState<Map<string, MealFeedback>>(new Map());
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  const mealTypes: Array<'breakfast' | 'lunch' | 'dinner'> = ['breakfast', 'lunch', 'dinner'];
  
  // Generate days dynamically based on meal plan start date
  const getDaysOfWeek = () => {
    if (!currentMealPlan) {
      // Default to static days if no meal plan
      return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
    
    const days = [];
    const weekStart = new Date(currentMealPlan.weekStartDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      days.push(dayName);
    }
    
    return days;
  };
  
  const daysOfWeek = getDaysOfWeek();

  useEffect(() => {
    if (user) {
      loadMealPlan();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile?.weeklyBudget) {
      setWeeklyBudget(userProfile.weeklyBudget);
    }
  }, [userProfile]);

  const loadMealPlan = async () => {
    try {
      setLoading(true);
      const plan = await mealPlanService.getCurrentWeekPlan(user!.uid);
      setCurrentMealPlan(plan);
      
      // Load feedback for all meals
      // Temporarily disabled - requires Firestore indexes to be created
      /*
      if (plan) {
        const feedbackMap = new Map<string, MealFeedback>();
        await Promise.all(
          plan.meals.map(async (meal) => {
            const feedback = await feedbackService.getMealFeedback(user!.uid, meal.id);
            if (feedback) {
              feedbackMap.set(meal.id, feedback);
            }
          })
        );
        setMealFeedback(feedbackMap);
      }
      */
    } catch (error) {
      console.error('Error loading meal plan:', error);
      toast.error('Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (
    rating: 'positive' | 'negative',
    reasons: string[],
    comment?: string
  ) => {
    if (!feedbackModal.meal || !user) return;

    try {
      const feedback: Omit<MealFeedback, 'timestamp'> = {
        mealId: feedbackModal.meal.id,
        rating,
        reasons,
        comment
      };

      await feedbackService.submitMealFeedback(user.uid, feedbackModal.meal.id, feedback);
      
      // Update local state
      const newFeedback = { ...feedback, timestamp: new Date() } as MealFeedback;
      setMealFeedback(prev => new Map(prev).set(feedbackModal.meal!.id, newFeedback));
      
      toast.success('Thanks for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const handleSwapMeal = async (mealId: string) => {
    try {
      setSwappingMealId(mealId);
      // TODO: Implement meal swap with user profile
      toast.success('Meal swap feature coming soon!');
    } catch (error) {
      console.error('Error swapping meal:', error);
      toast.error('Failed to swap meal');
    } finally {
      setSwappingMealId(null);
    }
  };

  const handleGeneratePlan = () => {
    // Check what's missing in the profile
    const missingItems: string[] = [];
    
    console.log('Current userProfile:', userProfile);
    
    if (!userProfile) {
      toast.error('Please create your profile first');
      navigate('/profile');
      return;
    }
    
    if (!userProfile.householdSize || userProfile.householdSize === 0) {
      missingItems.push('Household Size');
    }
    
    if (!userProfile.weeklyBudget || userProfile.weeklyBudget === 0) {
      missingItems.push('Weekly Budget');
    }
    
    if (!userProfile.cookingTimePreference?.weekday || userProfile.cookingTimePreference.weekday === 0) {
      missingItems.push('Weekday Cooking Time');
    }
    
    if (!userProfile.cookingTimePreference?.weekend || userProfile.cookingTimePreference.weekend === 0) {
      missingItems.push('Weekend Cooking Time');
    }
    
    if (missingItems.length > 0) {
      // Create a helpful error message
      const itemsList = missingItems.join(', ');
      toast.error(`Please complete these profile items: ${itemsList}`, {
        duration: 5000,
        icon: '📝'
      });
      
      // Navigate to profile with a query parameter to show the incomplete state
      navigate('/profile?from=meal-plan-incomplete');
      return;
    }
    
    // If all requirements are met, navigate to generate page
    navigate('/generate');
  };

  const getMealsByDayAndType = (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!currentMealPlan) return null;
    return currentMealPlan.meals.find(
      meal => meal.dayOfWeek === dayIndex && meal.mealType === mealType
    );
  };

  const getWeekDateRange = () => {
    if (!currentMealPlan) return '';
    
    const startOfWeek = new Date(currentMealPlan.weekStartDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${startOfWeek.toLocaleDateString('en-US', formatOptions)} - ${endOfWeek.toLocaleDateString('en-US', formatOptions)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your meal plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Your Meal Plan
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => {
                      // TODO: Implement previous week navigation
                      toast.error('Previous week navigation coming soon!');
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Previous week"
                  >
                    <ChevronLeftIcon className="h-4 w-4 text-gray-500" />
                  </button>
                  <p className="text-sm text-gray-600">
                    {getWeekDateRange()}
                  </p>
                  <button
                    onClick={() => {
                      // TODO: Implement next week navigation
                      toast.error('Next week navigation coming soon!');
                    }}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Next week"
                  >
                    <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/grocery-list')}
                className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Grocery List</span>
              </button>
              <button
                onClick={handleGeneratePlan}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">New Plan</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!currentMealPlan ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full mb-6">
                  <CalendarIcon className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  No Meal Plan Yet
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                  Let's create your first AI-powered meal plan tailored to your preferences and budget.
                </p>
                <button
                  onClick={handleGeneratePlan}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-lg font-semibold hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all shadow-lg"
                >
                  <SparklesIcon className="h-6 w-6 mr-3" />
                  Generate Your First Meal Plan
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Budget Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <CurrencyDollarIcon className="h-8 w-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-500">Total Cost</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${currentMealPlan.totalEstimatedCost.toFixed(2)}
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-gray-500">Weekly budget: ${weeklyBudget}</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <ChartBarIcon className="h-8 w-8 text-green-500" />
                    <span className="text-sm font-medium text-gray-500">Savings</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${Math.max(0, weeklyBudget - currentMealPlan.totalEstimatedCost).toFixed(2)}
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className={`${currentMealPlan.totalEstimatedCost > weeklyBudget ? 'text-red-500' : 'text-green-500'}`}>
                      {currentMealPlan.totalEstimatedCost > weeklyBudget ? 'Over budget' : 'Under budget'}
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <BoltIcon className="h-8 w-8 text-blue-500" />
                    <span className="text-sm font-medium text-gray-500">Meals</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {currentMealPlan.meals.length}
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-gray-500">Planned this week</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <ClockIcon className="h-8 w-8 text-purple-500" />
                    <span className="text-sm font-medium text-gray-500">Avg Time</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(currentMealPlan.meals.reduce((acc, meal) => acc + meal.prepTime + meal.cookTime, 0) / currentMealPlan.meals.length)} min
                  </div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-gray-500">Per meal</span>
                  </div>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Weekly Meals</h2>
                <div className="flex items-center bg-white rounded-lg shadow-sm p-1">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'cards' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Card View
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'calendar' 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Calendar View
                  </button>
                </div>
              </div>

              {/* Meal Display */}
              {viewMode === 'calendar' ? (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <MealPlanCalendar 
                    mealPlan={currentMealPlan}
                    onEventAdded={loadMealPlan}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  {/* Week at a Glance */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Week at a Glance</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 overflow-x-auto">
                      {daysOfWeek.map((day, dayIndex) => {
                        const dayMeals = currentMealPlan.meals.filter(meal => meal.dayOfWeek === dayIndex);
                        const dayTotal = dayMeals.reduce((sum, meal) => sum + meal.estimatedCost, 0);
                        
                        // Calculate the actual date for this day
                        const weekStart = new Date(currentMealPlan.weekStartDate);
                        const dayDate = new Date(weekStart);
                        dayDate.setDate(weekStart.getDate() + dayIndex);
                        
                        return (
                          <div
                            key={day}
                            className={`
                              p-3 rounded-lg text-center cursor-pointer transition-all
                              ${expandedDay === dayIndex 
                                ? 'bg-green-50 border-2 border-green-300 shadow-sm' 
                                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                              }
                            `}
                            onClick={() => setExpandedDay(expandedDay === dayIndex ? null : dayIndex)}
                          >
                            <h4 className="font-medium text-sm text-gray-700">{day.substring(0, 3)}</h4>
                            <p className="text-xs text-gray-500 mb-2">
                              {dayDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                            </p>
                            <div className="text-lg font-bold text-gray-900">{dayMeals.length}</div>
                            <div className="text-xs text-green-600 font-medium">${dayTotal.toFixed(0)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detailed Day View */}
                  {expandedDay !== null && (
                    <div className="border-t pt-6">
                      {(() => {
                        const dayMeals = currentMealPlan.meals.filter(meal => meal.dayOfWeek === expandedDay);
                        const weekStart = new Date(currentMealPlan.weekStartDate);
                        const dayDate = new Date(weekStart);
                        dayDate.setDate(weekStart.getDate() + expandedDay);
                        
                        return (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {daysOfWeek[expandedDay]} - {dayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                              </h3>
                              <button
                                onClick={() => setExpandedDay(null)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                              >
                                Hide Details
                              </button>
                            </div>
                              
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {mealTypes.map(mealType => {
                                const meal = getMealsByDayAndType(expandedDay, mealType);
                                  
                                  if (!meal) {
                                    return (
                                      <div key={mealType} className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                        <p className="text-sm text-gray-400 capitalize">{mealType}: Empty</p>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={meal.id}
                                      className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-sm transition-all cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedMeal(meal);
                                      }}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <span className="text-xs font-medium text-gray-600 uppercase">{mealType}</span>
                                        <span className="text-xs font-semibold text-green-600">${meal.estimatedCost.toFixed(2)}</span>
                                      </div>
                                      
                                      <h5 className="font-medium text-gray-900 text-sm mb-2 line-clamp-1">
                                        {meal.recipeName}
                                      </h5>
                                      
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center text-xs text-gray-600">
                                          <ClockIcon className="h-3 w-3 mr-1" />
                                          {meal.prepTime + meal.cookTime}m
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setFeedbackModal({ isOpen: true, meal });
                                            }}
                                            className="p-1 hover:bg-white rounded transition-colors"
                                            title="Rate meal"
                                          >
                                            {mealFeedback.has(meal.id) ? (
                                              mealFeedback.get(meal.id)!.rating === 'positive' ? (
                                                <ThumbUpSolid className="h-4 w-4 text-green-600" />
                                              ) : (
                                                <ThumbDownSolid className="h-4 w-4 text-red-600" />
                                              )
                                            ) : (
                                              <StarIcon className="h-4 w-4 text-gray-400" />
                                            )}
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleSwapMeal(meal.id);
                                            }}
                                            disabled={swappingMealId === meal.id}
                                            className="p-1 hover:bg-white rounded transition-colors disabled:opacity-50"
                                            title="Swap meal"
                                          >
                                            <ArrowPathIcon className={`h-4 w-4 text-gray-400 ${swappingMealId === meal.id ? 'animate-spin' : ''}`} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Quick Actions Bar */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">
                          {currentMealPlan.meals.length} meals
                        </span> planned this week
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate('/grocery-list')}
                          className="text-sm text-gray-600 hover:text-green-700 font-medium transition-colors"
                        >
                          View Shopping List →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Meal Plan Insights</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-3xl font-bold">{currentMealPlan.meals.filter(m => m.mealType === 'breakfast').length}</div>
                    <div className="text-green-100">Breakfasts</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{currentMealPlan.meals.filter(m => m.mealType === 'lunch').length}</div>
                    <div className="text-green-100">Lunches</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{currentMealPlan.meals.filter(m => m.mealType === 'dinner').length}</div>
                    <div className="text-green-100">Dinners</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">${(currentMealPlan.totalEstimatedCost / currentMealPlan.meals.length).toFixed(2)}</div>
                    <div className="text-green-100">Avg per meal</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Feedback Modal */}
      {feedbackModal.meal && (
        <MealFeedbackModal
          isOpen={feedbackModal.isOpen}
          onClose={() => setFeedbackModal({ isOpen: false, meal: null })}
          mealName={feedbackModal.meal.recipeName}
          onSubmit={handleSubmitFeedback}
        />
      )}

      {/* Selected Meal Details Modal */}
      {selectedMeal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedMeal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {selectedMeal.image && (
                <div className="h-64 w-full bg-gray-200">
                  <img 
                    src={selectedMeal.image} 
                    alt={selectedMeal.recipeName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <button
                onClick={() => setSelectedMeal(null)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedMeal.recipeName}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span className="capitalize bg-gray-100 px-3 py-1 rounded-full">{selectedMeal.mealType}</span>
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {selectedMeal.prepTime + selectedMeal.cookTime} minutes
                  </span>
                  <span className="flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    ${selectedMeal.estimatedCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{selectedMeal.description}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Ingredients</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {selectedMeal.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {ingredient.amount} {ingredient.unit} {ingredient.name}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedMeal.nutritionInfo && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Nutrition Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-gray-900">{selectedMeal.nutritionInfo.calories}</div>
                      <div className="text-xs text-gray-600">Calories</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-gray-900">{selectedMeal.nutritionInfo.protein}g</div>
                      <div className="text-xs text-gray-600">Protein</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-gray-900">{selectedMeal.nutritionInfo.carbs}g</div>
                      <div className="text-xs text-gray-600">Carbs</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-gray-900">{selectedMeal.nutritionInfo.fat}g</div>
                      <div className="text-xs text-gray-600">Fat</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedMeal(null);
                    setFeedbackModal({ isOpen: true, meal: selectedMeal });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all"
                >
                  <StarIcon className="h-5 w-5" />
                  Rate This Meal
                </button>
                <button
                  onClick={() => {
                    setSelectedMeal(null);
                    handleSwapMeal(selectedMeal.id);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Swap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealPlanPage; 