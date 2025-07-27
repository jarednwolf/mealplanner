import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mealPlanService } from '../services/mealPlan';
import { budgetService } from '../services/budget';
import { feedbackService } from '../services/feedback';
import { calendarService } from '../services/calendar';
import { groceryService } from '../services/grocery';
import { MealPlan, WeeklyBudget, CalendarEvent, MealFeedback } from '../types';
import { 
  CalendarIcon, 
  ShoppingCartIcon, 
  CurrencyDollarIcon, 
  PlusIcon, 
  ExclamationTriangleIcon, 
  LockClosedIcon, 
  ClockIcon, 
  SparklesIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BellIcon,
  CheckCircleIcon,
  LightBulbIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  HeartIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { db } from '../config/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeFirestoreCollections } from '../utils/initializeFirestore';
import ProfileCompletionModal from '../components/ProfileCompletionModal';
import ProfileCompletionStatus from '../components/ProfileCompletionStatus';
import ProfileOnboardingBanner from '../components/ProfileOnboardingBanner';

const DashboardPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlan | null>(null);
  const [weeklyBudget, setWeeklyBudget] = useState<WeeklyBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPermissionError, setHasPermissionError] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [dismissedOnboarding, setDismissedOnboarding] = useState(false);
  const [missingProfileItems, setMissingProfileItems] = useState<Array<{
    field: string;
    label: string;
    tab?: string;
    description?: string;
  }>>([]);
  
  // New state for engagement features
  const [recentFeedback, setRecentFeedback] = useState<MealFeedback[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<any>(null);
  const [todaysMealsRated, setTodaysMealsRated] = useState(false);

  useEffect(() => {
    if (user) {
      initializeUserData();
    }
  }, [user]);

  const initializeUserData = async () => {
    // Initialize Firestore collections if needed
    await initializeFirestoreCollections(user!.uid);
    
    // Then load data
    loadDashboardData();
    testFirestoreConnection(); // Test connection
  };

  // Test Firestore connection
  const testFirestoreConnection = async () => {
    try {
      console.log('🔥 Testing Firestore connection...');
      const testDoc = doc(db, 'test', 'connection-test');
      await setDoc(testDoc, {
        timestamp: new Date().toISOString(),
        userId: user?.uid,
        test: true
      });
      console.log('✅ Firestore connection successful!');
      // Clean up test doc
      await deleteDoc(testDoc);
    } catch (error: any) {
      console.error('❌ Firestore connection test failed:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Only load if user is authenticated
      if (!user?.uid) {
        console.warn('No user ID available');
        return;
      }

      // Load data with error handling for each service
      let mealPlan = null;
      let budget = null;

      try {
        console.log('📋 Attempting to load meal plan for user:', user.uid);
        mealPlan = await mealPlanService.getCurrentWeekPlan(user.uid);
        console.log('✅ Meal plan loaded:', mealPlan);
      } catch (error: any) {
        console.error('❌ Error loading meal plan:', error);
        console.error('Error details:', {
          code: error?.code,
          message: error?.message,
          stack: error?.stack
        });
        if (error?.code === 'permission-denied' || error?.message?.includes('permission-denied')) {
          console.warn('🔒 Firebase Permission Error: Please check FIREBASE_SETUP.md for instructions on setting up Firestore security rules.');
          setHasPermissionError(true);
        }
        // Continue execution even if meal plan fails
      }

      try {
        budget = await budgetService.getCurrentWeekBudget(user.uid);
      } catch (error: any) {
        console.error('Error loading budget:', error);
        if (error?.code === 'permission-denied' || error?.message?.includes('permission-denied')) {
          console.warn('🔒 Firebase Permission Error: Please check FIREBASE_SETUP.md for instructions on setting up Firestore security rules.');
          setHasPermissionError(true);
        }
        // Continue execution even if budget fails
      }
      
      // Load engagement data
      try {
        // Get feedback stats
        const stats = await feedbackService.getFeedbackStats(user.uid);
        setFeedbackStats(stats);
        setRecentFeedback(stats.recentFeedback || []);
        
        // Check if today's meals are rated
        if (mealPlan) {
          const todaysMeals = getTodaysMeals(mealPlan);
          const todaysRatings = stats.recentFeedback.filter(f => {
            const feedbackDate = new Date(f.timestamp);
            const today = new Date();
            return feedbackDate.toDateString() === today.toDateString();
          });
          setTodaysMealsRated(todaysRatings.length >= todaysMeals.length && todaysMeals.length > 0);
        }
        
        // Get upcoming calendar events
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const events = await calendarService.getEvents(tomorrow, weekFromNow);
        setUpcomingEvents(events.slice(0, 3)); // Show next 3 events
        
      } catch (error) {
        console.error('Error loading engagement data:', error);
        // Continue without engagement data
      }

      // Update state with whatever data we got
      if (mealPlan) setCurrentMealPlan(mealPlan);
      if (budget) setWeeklyBudget(budget);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Unable to load some data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getTodaysMeals = (mealPlan?: MealPlan | null) => {
    if (!mealPlan) return [];
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    return mealPlan.meals.filter(meal => meal.dayOfWeek === today);
  };

  const getBudgetStatus = () => {
    if (!weeklyBudget) return { percentage: 0, status: 'Good' };
    const percentage = (weeklyBudget.spent / weeklyBudget.budget) * 100;
    const status = percentage > 90 ? 'Warning' : percentage > 75 ? 'Caution' : 'Good';
    return { percentage, status };
  };

  const checkProfileComplete = () => {
    if (!userProfile) return false;
    
    return userProfile.householdSize > 0 &&
           userProfile.weeklyBudget > 0 &&
           userProfile.cookingTimePreference?.weekday > 0 &&
           userProfile.cookingTimePreference?.weekend > 0;
  };



  const handleGenerateMealPlan = async () => {
    console.log('handleGenerateMealPlan called');
    console.log('Current userProfile:', userProfile);
    
    try {
      // Check what's missing in the profile
      const missing: Array<{
        field: string;
        label: string;
        tab?: string;
        description?: string;
      }> = [];
      
      if (!userProfile) {
        console.log('No userProfile, navigating to profile page');
        navigate('/profile?from=meal-plan-incomplete');
        return;
      }
      
      if (!userProfile.householdSize || userProfile.householdSize === 0) {
        missing.push({
          field: 'householdSize',
          label: 'Household Size',
          tab: 'general',
          description: 'Number of people in your household'
        });
      }
      
      if (!userProfile.weeklyBudget || userProfile.weeklyBudget === 0) {
        missing.push({
          field: 'weeklyBudget',
          label: 'Weekly Budget',
          tab: 'preferences',
          description: 'Your target budget for weekly groceries'
        });
      }
      
      if (!userProfile.cookingTimePreference?.weekday || userProfile.cookingTimePreference.weekday === 0) {
        missing.push({
          field: 'cookingTimeWeekday',
          label: 'Weekday Cooking Time',
          tab: 'cooking',
          description: 'How much time you have to cook on weekdays'
        });
      }
      
      if (!userProfile.cookingTimePreference?.weekend || userProfile.cookingTimePreference.weekend === 0) {
        missing.push({
          field: 'cookingTimeWeekend',
          label: 'Weekend Cooking Time',
          tab: 'cooking',
          description: 'How much time you have to cook on weekends'
        });
      }
      
      console.log('Missing items:', missing);
      
      if (missing.length > 0) {
        console.log('Showing modal with missing items');
        // Show the modal with missing items
        setMissingProfileItems(missing);
        setShowCompletionModal(true);
        return;
      }
      
      console.log('Profile complete, navigating to meal plan generation');
      // Navigate to the meal plan generation wizard
      navigate('/meal-plan/generate');
    } catch (error) {
      console.error('Error navigating to meal plan:', error);
      toast.error('Failed to navigate to meal plan');
    }
  };

  // Get today's meals
  const todaysMeals = getTodaysMeals(currentMealPlan);
  
  // Get current budget
  const currentBudget = weeklyBudget;
  
  // Calculate insights
  const budgetSpentPercentage = currentBudget ? (currentBudget.spent / currentBudget.budget) * 100 : 0;
  const mealsPlannedThisWeek = currentMealPlan?.meals.length || 0;
  const avgMealRating = feedbackStats?.positiveRatings && feedbackStats?.totalMealsRated > 0
    ? (feedbackStats.positiveRatings / feedbackStats.totalMealsRated) * 5
    : 0;

  const quickStats = [
    {
      label: 'Weekly Budget',
      value: weeklyBudget ? `$${weeklyBudget.budget}` : '-',
      subtext: weeklyBudget ? `$${weeklyBudget.spent.toFixed(2)} spent` : '',
      icon: CurrencyDollarIcon,
      color: 'blue',
    },
    {
      label: 'Meals Planned',
      value: currentMealPlan ? currentMealPlan.meals.length : 0,
      subtext: 'This week',
      icon: CalendarIcon,
      color: 'green',
    },
    {
      label: 'Grocery Items',
      value: currentMealPlan?.groceryList?.length || 0,
      subtext: 'To buy',
      icon: ShoppingCartIcon,
      color: 'purple',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Onboarding Banner - Shows prominently at top when profile incomplete */}
      {userProfile && !checkProfileComplete() && !dismissedOnboarding && (
        <ProfileOnboardingBanner 
          userProfile={userProfile}
          onDismiss={() => setDismissedOnboarding(true)}
        />
      )}

      {/* Permission Error Banner */}
      {hasPermissionError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Database permissions need to be configured.</strong>
                  {' '}Please check the console for setup instructions or see{' '}
                  <span className="font-mono text-xs bg-yellow-100 px-1 py-0.5 rounded">FIREBASE_SETUP.md</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

                {/* Main Content */}
          <main className="py-6 md:py-8 bg-gray-50 min-h-screen relative">
            {/* Subtle pattern background */}
            <div className="absolute inset-0 opacity-[0.02]">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310B981' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        {/* Streamlined Welcome Section */}
              <div className="mb-6">
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight font-display">
                  Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!
                </h2>
                <p className="text-lg text-gray-600 mt-2 font-medium">
                  {currentMealPlan ? 
                    `${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` : 
                    "Let's get started with your meal planning journey"
                  }
                </p>
              </div>

          {/* Main Dashboard Grid */}
          {currentMealPlan ? (
            <div className="space-y-6">
              {/* Top Row: Key Metrics and Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Progress Card */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200 relative overflow-hidden group hover:shadow-lg transition-all duration-300 animate-fade-in-up">
                  {/* Decorative element */}
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-xl font-bold text-gray-900">
                      This Week's Progress
                    </h3>
                    <Link
                      to="/meal-plan"
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      View full plan →
                    </Link>
                  </div>
                  
                  {/* Progress Bars */}
                  <div className="space-y-4">
                    {/* Meals Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Meals Planned</span>
                        <span className="font-medium">{mealsPlannedThisWeek}/21</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${(mealsPlannedThisWeek / 21) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Budget Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Budget Used</span>
                        <span className={`font-medium ${budgetSpentPercentage > 90 ? 'text-red-600' : budgetSpentPercentage > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                          ${currentBudget?.spent.toFixed(0)}/${currentBudget?.budget.toFixed(0)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            budgetSpentPercentage > 90 ? 'bg-red-500' : 
                            budgetSpentPercentage > 75 ? 'bg-yellow-500' : 
                            'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(budgetSpentPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Today's Meals Quick View */}
                  <div className="mt-6 pt-6 border-t border-green-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Today's Meals</h4>
                    {todaysMeals.length > 0 ? (
                      <div className="space-y-2">
                        {todaysMeals.map((meal, index) => (
                          <div 
                            key={meal.id} 
                            className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-100 hover:border-green-200 hover:shadow-md transition-all duration-300 group"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div>
                              <p className="font-medium text-gray-900">{meal.recipeName}</p>
                              <p className="text-sm text-gray-500">{meal.mealType} • {meal.prepTime + meal.cookTime} min</p>
                            </div>
                            {!todaysMealsRated && (
                              <button
                                onClick={() => navigate(`/meal-plan?rate=${meal.id}`)}
                                className="text-sm text-green-600 hover:text-green-700 font-medium px-3 py-1 rounded-md hover:bg-green-50 transition-colors"
                              >
                                Rate
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No meals planned for today</p>
                    )}
                  </div>
                </div>
                
                {/* Quick Actions Card */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-sm p-6 text-white relative overflow-hidden group">
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <h3 className="text-lg font-semibold mb-4 relative z-10">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    {!todaysMealsRated && todaysMeals.length > 0 && (
                      <button
                        onClick={() => navigate('/meal-plan?view=feedback')}
                        className="w-full flex items-center justify-between p-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-200 border border-white/20 hover:scale-[1.02] transform"
                      >
                        <div className="flex items-center">
                          <StarIcon className="h-5 w-5 mr-2 animate-pulse" />
                          <span className="text-sm font-medium">Rate today's meals</span>
                        </div>
                        <span className="text-xs bg-yellow-400 text-gray-900 px-2 py-1 rounded font-medium animate-bounce">New</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => navigate('/grocery-list')}
                      className="w-full flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/10 hover:scale-[1.02] transform"
                    >
                      <div className="flex items-center">
                        <ShoppingCartIcon className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium">Update shopping list</span>
                      </div>
                      <ArrowRightIcon className="h-4 w-4 text-white/60" />
                    </button>
                    
                                          <button
                        onClick={() => navigate('/meal-plan/generate')}
                        className="w-full flex items-center justify-between p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-sm"
                      >
                        <div className="flex items-center">
                          <SparklesIcon className="h-5 w-5 mr-2" />
                          <span className="text-sm">Generate new meals</span>
                        </div>
                      </button>
                  </div>
                </div>
              </div>
              
              {/* Activity Feed & Insights Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity Feed */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {/* Dynamic activity items */}
                    {budgetSpentPercentage < 80 && currentBudget && (
                      <div className="flex items-start p-3 rounded-lg bg-green-50 border border-green-100 hover:border-green-200 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CurrencyDollarIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-900">
                            You're under budget by <span className="font-medium text-green-600">
                              ${(currentBudget.budget - currentBudget.spent).toFixed(0)}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">Keep up the great work!</p>
                        </div>
                      </div>
                    )}
                    
                    {upcomingEvents.length > 0 && (
                      <div className="flex items-start p-3 rounded-lg bg-blue-50 border border-blue-100 hover:border-blue-200 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <CalendarDaysIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-900">
                            {upcomingEvents[0].title} {upcomingEvents[0].type === 'date_night' ? '❤️' : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(upcomingEvents[0].date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {feedbackStats && feedbackStats.positiveRatings > 0 && (
                      <div className="flex items-start p-3 rounded-lg bg-purple-50 border border-purple-100 hover:border-purple-200 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <StarIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-900">
                            You've rated <span className="font-medium">{feedbackStats.totalMealsRated}</span> meals
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {Math.round((feedbackStats.positiveRatings / feedbackStats.totalMealsRated) * 100)}% positive
                          </p>
                        </div>
                      </div>
                    )}
                    
                                          {/* Always show at least one item */}
                      {(!upcomingEvents.length && !feedbackStats?.totalMealsRated) && (
                        <div className="flex items-start p-3 rounded-lg bg-gradient-to-br from-gray-50 to-green-50/20 border border-gray-100 hover:border-green-200 transition-all duration-300 group">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <SparklesIcon className="h-4 w-4 text-white animate-pulse" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-gray-900">Welcome to your meal planner!</p>
                            <p className="text-xs text-gray-500 mt-0.5">Start rating meals to get personalized insights</p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
                
                {/* Insights Card */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm p-6 border border-indigo-100 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                  {/* Decorative shapes */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-indigo-200 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-300"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-purple-200 rounded-tr-full opacity-20 group-hover:scale-110 transition-transform duration-300"></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 relative z-10">
                    Your Insights
                  </h3>
                  <div className="space-y-4">
                    {/* Cost Trend */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                      <div>
                        <p className="text-sm text-gray-600">Avg meal cost</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${currentMealPlan ? (currentMealPlan.totalEstimatedCost / mealsPlannedThisWeek).toFixed(2) : '0.00'}
                        </p>
                      </div>
                      <div className={`flex items-center p-2 rounded-full ${budgetSpentPercentage < 80 ? 'bg-green-100' : 'bg-red-100'}`}>
                        {budgetSpentPercentage < 80 ? (
                          <ArrowTrendingDownIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <ArrowTrendingUpIcon className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                    
                    {/* Favorite Cuisine */}
                    {feedbackStats?.mostCommonReasons.length > 0 && (
                      <div className="p-4 bg-white rounded-lg shadow-sm">
                        <p className="text-sm text-gray-600 mb-2">Top preferences</p>
                        <div className="flex flex-wrap gap-2">
                          {feedbackStats.mostCommonReasons.slice(0, 3).map((reason: string) => (
                            <span key={reason} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Quick tip */}
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-start">
                        <LightBulbIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <p className="ml-2 text-sm text-gray-700">
                          {budgetSpentPercentage > 80 ? 
                            "Try swapping a few meals for budget-friendly options" :
                            "Great job staying under budget! Consider trying a new cuisine this week"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
                            ) : (
                    // Enhanced empty state for new users
                    <div className="space-y-6 animate-fade-in-up">
              {/* Personalized Welcome & Getting Started */}
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 relative overflow-hidden">
                {/* Subtle geometric pattern overlay */}
                <div className="absolute top-0 right-0 w-64 h-64 opacity-5">
                  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#10B981" d="M47.1,-57.1C59.9,-45.6,68.4,-29.1,70.8,-11.9C73.2,5.3,69.5,23.2,59.8,37.3C50.1,51.4,34.3,61.6,16.9,65.4C-0.5,69.2,-19.5,66.5,-35.3,58.3C-51.1,50.1,-63.7,36.3,-69.1,20C-74.5,3.7,-72.7,-15.1,-65.4,-31.3C-58.1,-47.5,-45.3,-61.1,-30.1,-71.8C-14.9,-82.5,2.7,-90.3,20.3,-88.5C37.9,-86.7,34.3,-68.6,47.1,-57.1Z" transform="translate(100 100)" />
                  </svg>
                </div>
                {checkProfileComplete() ? (
                  <div className="relative z-10">
                    {/* Personalized greeting based on time of day */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                        {new Date().getHours() < 12 ? 'Good morning' : 
                         new Date().getHours() < 17 ? 'Good afternoon' : 
                         'Good evening'}{user?.displayName ? `, ${user.displayName}` : ''}!
                      </h3>
                      <p className="text-lg text-gray-600 leading-relaxed">
                        Your profile is all set. Let's start planning meals that work for your{' '}
                        <span className="font-bold text-green-600">
                          {userProfile?.householdSize === 1 ? 'schedule' : `family of ${userProfile?.householdSize}`}
                        </span>{' '}
                        and{' '}
                        <span className="font-bold text-green-600">${userProfile?.weeklyBudget} weekly budget</span>.
                      </p>
                    </div>
                    
                    {/* Quick Start Guide */}
                    <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-xl p-6 mb-6 border border-gray-200">
                      <h4 className="text-base font-bold text-gray-900 mb-4">
                        Your Quick Start Guide
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                            <CheckCircleIcon className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Profile complete</p>
                            <p className="text-xs text-gray-500">
                              {userProfile?.cookingTimePreference?.weekday}min cooking time on weekdays
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300 bg-white mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Generate your first meal plan</p>
                            <p className="text-xs text-gray-500">
                              Personalized to your dietary preferences
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300 bg-white mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Start tracking your meals</p>
                            <p className="text-xs text-gray-500">
                              Rate meals to get better recommendations
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Primary CTA */}
                    <div className="text-center">
                      <button
                        onClick={handleGenerateMealPlan}
                        className="bg-green-600 text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center"
                      >
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        Generate My First Meal Plan
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        Takes about 30 seconds
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Welcome{user?.displayName ? `, ${user.displayName}` : ''}!
                      </h3>
                      <p className="text-gray-600">
                        Let's set up your profile so we can create meal plans that fit your lifestyle.
                      </p>
                    </div>
                    <ProfileCompletionStatus 
                      userProfile={userProfile}
                      onComplete={() => navigate('/profile')}
                    />
                  </div>
                )}
              </div>
              
              {/* Your Goals & Preferences (if profile exists) */}
              {userProfile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Your Setup Summary */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100 relative group hover:shadow-lg transition-all duration-300">
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-blue-500 rounded-lg opacity-10 group-hover:scale-150 transition-transform duration-300"></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Your Setup
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg">
                        <p className="text-sm text-gray-600">Weekly budget</p>
                        <p className="text-lg font-medium text-gray-900">
                          ${userProfile.weeklyBudget} 
                          <span className="text-sm text-gray-500 font-normal ml-1">
                            (~${(userProfile.weeklyBudget / 7).toFixed(0)}/day)
                          </span>
                        </p>
                      </div>
                      <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg">
                        <p className="text-sm text-gray-600">Cooking time</p>
                        <p className="text-base font-medium text-gray-900">
                          {userProfile.cookingTimePreference?.weekday}min weekdays, {userProfile.cookingTimePreference?.weekend}min weekends
                        </p>
                      </div>
                      {userProfile.dietaryRestrictions && userProfile.dietaryRestrictions.length > 0 && (
                        <div className="p-3 bg-white/70 backdrop-blur-sm rounded-lg">
                          <p className="text-sm text-gray-600">Dietary preferences</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {userProfile.dietaryRestrictions.map((diet) => (
                              <span key={diet} className="text-xs bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                                {diet}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* What to Expect */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm p-6 border border-purple-100 relative group hover:shadow-lg transition-all duration-300">
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-lg opacity-10 group-hover:scale-150 transition-transform duration-300"></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      What Happens Next
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start p-3 bg-white/70 backdrop-blur-sm rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                          <SparklesIcon className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-gray-700">
                          We'll create a week of meals under ${userProfile.weeklyBudget} that take less than {userProfile.cookingTimePreference?.weekday} minutes on busy days
                        </p>
                      </div>
                      <div className="flex items-start p-3 bg-white/70 backdrop-blur-sm rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                          <CalendarIcon className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-gray-700">
                          Your meal plan adapts to your schedule and special events
                        </p>
                      </div>
                      <div className="flex items-start p-3 bg-white/70 backdrop-blur-sm rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                          <StarIcon className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-gray-700">
                          Rate meals to train the AI on your preferences
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Learning Center for New Users */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Get the Most from Your Meal Planner</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                        <LightBulbIcon className="h-5 w-5 text-yellow-600" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900">Pro Tip</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Add your calendar events (date nights, travel) to get meal plans that work around your life
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                        <ChartBarIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900">Track Progress</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      After your first week, you'll see savings insights and meal preferences here
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900">Smart Shopping</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Your grocery list automatically organizes by store aisle and finds the best prices
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Empty State Activity Feed */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h3>
                <div className="text-center py-8 px-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ClockIcon className="h-8 w-8 text-gray-500" />
                  </div>
                  <p className="text-gray-600 text-sm">
                    Your meal planning journey starts here. Activities like meal ratings, savings, and cooking streaks will appear here.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        missingItems={missingProfileItems}
      />
    </div>
  );
};

export default DashboardPage; 