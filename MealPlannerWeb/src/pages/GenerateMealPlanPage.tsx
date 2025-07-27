import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserProfile, MealPlan } from '../types';
import { mealPlanService } from '../services/mealPlan';
import { householdMemberService } from '../services';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import ProfileSetupCheck from '../components/ProfileSetupCheck';
import {
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  CogIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import MealPlanGenerationModal from '../components/MealPlanGenerationModal';

interface GenerationOptions {
  excludeRecipes: string[];
  pantryItems: string[];
  specialRequests: string;
  mealComplexity: 'simple' | 'balanced' | 'adventurous';
  budgetPriority: 'strict' | 'flexible' | 'quality';
}

const GenerateMealPlanPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<MealPlan | null>(null);
  const [householdMemberCount, setHouseholdMemberCount] = useState(0);
  const [setupCheckLoading, setSetupCheckLoading] = useState(true);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  
  const [options, setOptions] = useState<GenerationOptions>({
    excludeRecipes: [],
    pantryItems: [],
    specialRequests: '',
    mealComplexity: 'balanced',
    budgetPriority: 'flexible'
  });

  const steps = [
    { title: 'Review Preferences', icon: HeartIcon },
    { title: 'Generation Options', icon: CogIcon },
    { title: 'Special Requests', icon: LightBulbIcon },
    { title: 'Generate Plan', icon: SparklesIcon }
  ];

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setSetupCheckLoading(true);
      
      // Load user profile
      const docRef = doc(db, 'users', user!.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        setUserProfile(profile);
        
        // Load household member count
        try {
          const members = await householdMemberService.getHouseholdMembers(user!.uid);
          setHouseholdMemberCount(members.length);
        } catch (error) {
          console.error('Error loading household members:', error);
          // Continue anyway - household members are optional
        }
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setSetupCheckLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateMealPlan = async () => {
    if (!userProfile) {
      toast.error('Profile not loaded');
      return;
    }

    setShowGenerationModal(true);
    
    try {
      setGenerating(true);
      
      // Start from tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const plan = await mealPlanService.generateWeeklyPlan(userProfile, {
        excludeRecipes: options.excludeRecipes,
        pantryItems: options.pantryItems,
        preferredCuisines: userProfile.cuisinePreferences,
        weekStartDate: tomorrow
      });
      
      setGeneratedPlan(plan);
      
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast.error('Failed to generate meal plan. Please try again.');
      setShowGenerationModal(false);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerationComplete = () => {
    setShowGenerationModal(false);
    navigate('/meal-plan');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Review Preferences
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mb-4">
                <HeartIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Review Your Preferences</h2>
              <p className="mt-2 text-gray-600">Let's make sure we have everything right</p>
            </div>

            {userProfile && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Household & Budget</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <UserGroupIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <span>
                        <span className="font-medium text-gray-900">{userProfile.householdSize}</span> {userProfile.householdSize === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <span>
                        <span className="font-medium text-gray-900">${userProfile.weeklyBudget}</span> weekly
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Dietary Restrictions</h3>
                  {userProfile.dietaryRestrictions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userProfile.dietaryRestrictions.map(restriction => (
                        <span key={restriction} className="px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-700 rounded-full text-sm font-medium">
                          {restriction}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No dietary restrictions</p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Cuisine Preferences</h3>
                  {userProfile.cuisinePreferences.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userProfile.cuisinePreferences.map(cuisine => (
                        <span key={cuisine} className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-full text-sm font-medium">
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No cuisine preferences set</p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Cooking Time</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <span>
                        Weekdays: <span className="font-medium text-gray-900">{userProfile.cookingTimePreference.weekday} min</span>
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <ClockIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <span>
                        Weekends: <span className="font-medium text-gray-900">{userProfile.cookingTimePreference.weekend} min</span>
                      </span>
                    </div>
                  </div>
                </div>

                {userProfile.goals && userProfile.goals.length > 0 && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                    <h3 className="font-medium text-gray-900 mb-3">Your Goals</h3>
                    <div className="flex flex-wrap gap-2">
                      {userProfile.goals.map(goal => {
                        const goalLabels: Record<string, string> = {
                          'save-money': 'Save money',
                          'save-time': 'Save time',
                          'lower-stress': 'Lower stress',
                          'improve-health': 'Improve health',
                          'lose-weight': 'Lose weight',
                          'simplify-cooking': 'Simplify cooking',
                          'shop-less': 'Shop less',
                          'waste-less': 'Waste less food'
                        };
                        return (
                          <span key={goal} className="px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 rounded-full text-sm font-medium">
                            {goalLabels[goal] || goal}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />
                Need to update your preferences? Visit your <button onClick={() => navigate('/profile')} className="underline font-medium hover:text-blue-900">profile settings</button>.
              </p>
            </div>
          </div>
        );

      case 1: // Generation Options
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-4">
                <CogIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Generation Options</h2>
              <p className="mt-2 text-gray-600">Customize how your meal plan is created</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Meal Complexity
              </label>
              <div className="space-y-3">
                {[
                  { value: 'simple', label: 'Simple', desc: 'Quick & easy recipes with minimal ingredients' },
                  { value: 'balanced', label: 'Balanced', desc: 'Mix of simple and interesting recipes' },
                  { value: 'adventurous', label: 'Adventurous', desc: 'Try new cuisines and cooking techniques' }
                ].map(option => (
                  <label key={option.value} className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    options.mealComplexity === option.value 
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                    <input
                      type="radio"
                      value={option.value}
                      checked={options.mealComplexity === option.value}
                      onChange={(e) => setOptions({ ...options, mealComplexity: e.target.value as any })}
                      className="mt-1 mr-3 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Budget Priority
              </label>
              <div className="space-y-3">
                {[
                  { value: 'strict', label: 'Strict Budget', desc: 'Stay well under budget, prioritize savings' },
                  { value: 'flexible', label: 'Flexible Budget', desc: 'Balance cost and quality' },
                  { value: 'quality', label: 'Quality First', desc: 'Focus on best ingredients, budget is secondary' }
                ].map(option => (
                  <label key={option.value} className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    options.budgetPriority === option.value 
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                    <input
                      type="radio"
                      value={option.value}
                      checked={options.budgetPriority === option.value}
                      onChange={(e) => setOptions({ ...options, budgetPriority: e.target.value as any })}
                      className="mt-1 mr-3 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pantry Items (Optional)
              </label>
              <textarea
                value={options.pantryItems.join('\n')}
                onChange={(e) => setOptions({ ...options, pantryItems: e.target.value.split('\n').filter(item => item.trim()) })}
                placeholder="Enter items you already have, one per line&#10;e.g.:&#10;Rice&#10;Olive oil&#10;Canned tomatoes"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                rows={4}
              />
              <p className="mt-1 text-xs text-gray-500">We'll try to use these items in your meal plan</p>
            </div>
          </div>
        );

      case 2: // Special Requests
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
                <LightBulbIcon className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Special Requests</h2>
              <p className="mt-2 text-gray-600">Any specific preferences for this week?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                value={options.specialRequests}
                onChange={(e) => setOptions({ ...options, specialRequests: e.target.value })}
                placeholder="e.g.:&#10;- Include a birthday dinner on Friday&#10;- Need meals that reheat well for lunch&#10;- Extra vegetables this week&#10;- Avoid seafood (guest allergies)"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                rows={6}
              />
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-medium text-amber-900 mb-3 flex items-center">
                <LightBulbIcon className="h-5 w-5 mr-2 text-amber-600" />
                Pro Tips
              </h4>
              <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside ml-7">
                <li>Mention any upcoming events or gatherings</li>
                <li>Note if you need extra leftovers for lunches</li>
                <li>Specify if certain days need quicker meals</li>
                <li>Include seasonal preferences (e.g., "summer salads")</li>
              </ul>
            </div>
          </div>
        );

      case 3: // Generate
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mb-4 ${
                generating ? 'animate-pulse' : ''
              }`}>
                <SparklesIcon className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {generating ? 'Creating Your Perfect Meal Plan...' : 'Ready to Generate!'}
              </h2>
              <p className="mt-2 text-gray-600">
                {generating 
                  ? 'This usually takes 10-20 seconds' 
                  : 'Your personalized meal plan is just one click away'}
              </p>
            </div>

            {generating ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-2">
                    <p>Analyzing your preferences...</p>
                    <p>Finding perfect recipes...</p>
                    <p>Optimizing for your budget...</p>
                    <p>Creating grocery list...</p>
                  </div>
                </div>
              </div>
            ) : generatedPlan ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full">
                  <CheckIcon className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Success!</h3>
                  <p className="text-gray-600">Your meal plan has been generated</p>
                  <p className="text-sm text-gray-500 mt-1">Redirecting to your meal plan...</p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 space-y-3">
                <h3 className="font-medium text-gray-900">Your meal plan will include:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>21 meals (7 breakfasts, 7 lunches, 7 dinners)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Recipes matching your dietary restrictions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Complete grocery list with estimated costs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Meals within your ${userProfile?.weeklyBudget || 100} budget</span>
                  </li>
                  <li className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>Cooking times that fit your schedule</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading state
  if (setupCheckLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Check if profile setup is complete
  const isProfileValid = userProfile && 
    userProfile.householdSize > 0 && 
    userProfile.weeklyBudget > 0 &&
    userProfile.cookingTimePreference?.weekday > 0 &&
    userProfile.cookingTimePreference?.weekend > 0;

  // Show setup check if profile is incomplete
  if (!isProfileValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <ProfileSetupCheck 
          userProfile={userProfile} 
          householdMemberCount={householdMemberCount} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Fixed header with progress */}
      <div className="bg-gradient-to-br from-green-50/95 via-blue-50/95 to-purple-50/95 backdrop-blur-sm px-4 py-6 shadow-sm">
        <div className="max-w-3xl mx-auto">
          {/* Progress Steps */}
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 md:top-6 left-0 right-0 h-0.5 bg-gray-200">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
            </div>
            
            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className="relative">
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 bg-white border-2 ${
                          isCompleted
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg scale-100 border-green-600'
                            : isCurrent
                            ? 'bg-gradient-to-br from-green-400 to-green-500 text-white ring-4 ring-green-200 shadow-xl scale-110 border-green-500'
                            : 'bg-gray-200 text-gray-500 border-gray-300'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckIconSolid className="h-5 w-5 md:h-6 md:w-6" />
                        ) : (
                          <span className="text-sm md:text-base">{index + 1}</span>
                        )}
                      </div>
                      {isCurrent && (
                        <div className="absolute -inset-1 bg-green-400 rounded-full opacity-25 animate-pulse" />
                      )}
                    </div>
                    <p className={`mt-3 text-xs md:text-sm whitespace-nowrap ${
                      index <= currentStep ? 'text-gray-900 font-medium' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Card with gradient border */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 rounded-2xl blur-xl opacity-30" />
            <div className="relative bg-white rounded-2xl shadow-2xl">
              {/* Step content */}
              <div className="p-8">
                {renderStepContent()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between p-8 pt-0">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0 || generating}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                    currentStep === 0 || generating
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                  }`}
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back
                </button>

                {currentStep === steps.length - 1 ? (
                  <button
                    onClick={generateMealPlan}
                    disabled={generating || !!generatedPlan}
                    className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all ${
                      generating || generatedPlan
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105 shadow-lg'
                    }`}
                  >
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    {generating ? 'Generating...' : 'Generate Meal Plan'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center px-6 py-2 rounded-lg font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105 shadow-lg transition-all"
                  >
                    Next
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cancel Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/meal-plan')}
              disabled={generating}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel and return to meal plans
            </button>
          </div>
        </div>
      </div>
      
      {/* Generation Modal */}
      <MealPlanGenerationModal
        isOpen={showGenerationModal}
        onClose={() => setShowGenerationModal(false)}
        onComplete={handleGenerationComplete}
      />
    </div>
  );
};

export default GenerateMealPlanPage; 