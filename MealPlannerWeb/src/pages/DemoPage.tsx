import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  SparklesIcon, 
  CurrencyDollarIcon, 
  ClockIcon,
  ShoppingCartIcon,
  ArrowRightIcon,
  CheckIcon,
  LockClosedIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
interface DemoMeal {
  day: string;
  type: 'breakfast' | 'lunch' | 'dinner';
  name: string;
  estimatedCost: number;
  cookTime: number;
  servings: number;
}

const DemoPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    dietaryRestrictions: [] as string[],
    budget: 150,
    householdSize: 4,
    cookingTime: 'medium' as 'quick' | 'medium' | 'leisurely',
    cuisinePreferences: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [demoMealPlan, setDemoMealPlan] = useState<DemoMeal[]>([]);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Nut-Free',
    'Keto',
    'Paleo',
    'Low-Carb'
  ];

  const cuisineOptions = [
    'American',
    'Italian',
    'Mexican',
    'Asian',
    'Mediterranean',
    'Indian',
    'French',
    'Thai'
  ];

  const generateDemoMealPlan = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a sample 3-day meal plan
    const sampleMeals: DemoMeal[] = [
      // Day 1
      { day: 'Monday', type: 'breakfast', name: 'Overnight Oats with Berries', estimatedCost: 3.50, cookTime: 5, servings: 4 },
      { day: 'Monday', type: 'lunch', name: 'Mediterranean Quinoa Bowl', estimatedCost: 8.00, cookTime: 20, servings: 4 },
      { day: 'Monday', type: 'dinner', name: 'Herb-Crusted Chicken with Roasted Vegetables', estimatedCost: 15.00, cookTime: 35, servings: 4 },
      
      // Day 2
      { day: 'Tuesday', type: 'breakfast', name: 'Scrambled Eggs with Toast', estimatedCost: 4.00, cookTime: 10, servings: 4 },
      { day: 'Tuesday', type: 'lunch', name: 'Chicken Caesar Wrap', estimatedCost: 9.00, cookTime: 15, servings: 4 },
      { day: 'Tuesday', type: 'dinner', name: 'Spaghetti with Homemade Marinara', estimatedCost: 11.00, cookTime: 25, servings: 4 },
      
      // Day 3
      { day: 'Wednesday', type: 'breakfast', name: 'Greek Yogurt Parfait', estimatedCost: 5.00, cookTime: 5, servings: 4 },
      { day: 'Wednesday', type: 'lunch', name: 'Turkey and Avocado Sandwich', estimatedCost: 10.00, cookTime: 10, servings: 4 },
      { day: 'Wednesday', type: 'dinner', name: 'Teriyaki Salmon with Rice', estimatedCost: 18.00, cookTime: 30, servings: 4 }
    ];
    
    setDemoMealPlan(sampleMeals);
    setLoading(false);
    setStep(3);
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setPreferences(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const toggleCuisinePreference = (cuisine: string) => {
    setPreferences(prev => ({
      ...prev,
      cuisinePreferences: prev.cuisinePreferences.includes(cuisine)
        ? prev.cuisinePreferences.filter(c => c !== cuisine)
        : [...prev.cuisinePreferences, cuisine]
    }));
  };

  const calculateTotalCost = () => {
    return demoMealPlan.reduce((total, meal) => total + meal.estimatedCost, 0);
  };

  const handleSignUp = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <ShoppingCartIcon className="h-8 w-8 text-green-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">MealPlanner</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                Home
              </Link>
              <Link 
                to="/login" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Sign Up / Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-green-600' : 'bg-gray-200'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-24 h-1 ${step >= 3 ? 'bg-green-600' : 'bg-gray-200'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Basic Preferences */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Let's Get Started!</h2>
            <p className="text-gray-600 mb-8">
              Tell us a bit about your household and preferences to create your demo meal plan.
            </p>

            <div className="space-y-6">
              {/* Household Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many people are in your household?
                </label>
                <select
                  value={preferences.householdSize}
                  onChange={(e) => setPreferences(prev => ({ ...prev, householdSize: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value={1}>1 person</option>
                  <option value={2}>2 people</option>
                  <option value={3}>3 people</option>
                  <option value={4}>4 people</option>
                  <option value={5}>5 people</option>
                  <option value={6}>6+ people</option>
                </select>
              </div>

              {/* Weekly Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekly grocery budget
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="50"
                    max="300"
                    value={preferences.budget}
                    onChange={(e) => setPreferences(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <div className="w-20 text-center">
                    <span className="text-2xl font-bold text-green-600">${preferences.budget}</span>
                  </div>
                </div>
              </div>

              {/* Cooking Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How much time do you typically have for cooking?
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, cookingTime: 'quick' }))}
                    className={`p-4 rounded-lg border-2 ${
                      preferences.cookingTime === 'quick' 
                        ? 'border-green-600 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ClockIcon className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Quick</div>
                    <div className="text-sm text-gray-600">15-30 min</div>
                  </button>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, cookingTime: 'medium' }))}
                    className={`p-4 rounded-lg border-2 ${
                      preferences.cookingTime === 'medium' 
                        ? 'border-green-600 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ClockIcon className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Medium</div>
                    <div className="text-sm text-gray-600">30-45 min</div>
                  </button>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, cookingTime: 'leisurely' }))}
                    className={`p-4 rounded-lg border-2 ${
                      preferences.cookingTime === 'leisurely' 
                        ? 'border-green-600 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <ClockIcon className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">Leisurely</div>
                    <div className="text-sm text-gray-600">45+ min</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                Next Step
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Dietary & Cuisine Preferences */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dietary & Cuisine Preferences</h2>
            <p className="text-gray-600 mb-8">
              Select any dietary restrictions and your favorite cuisines.
            </p>

            <div className="space-y-8">
              {/* Dietary Restrictions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Dietary Restrictions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {dietaryOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => toggleDietaryRestriction(option)}
                      className={`px-4 py-2 rounded-lg border ${
                        preferences.dietaryRestrictions.includes(option)
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuisine Preferences */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Favorite Cuisines</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {cuisineOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => toggleCuisinePreference(option)}
                      className={`px-4 py-2 rounded-lg border ${
                        preferences.cuisinePreferences.includes(option)
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-gray-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                onClick={generateDemoMealPlan}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                Generate Demo Meal Plan
                <SparklesIcon className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-12">
            <div className="text-center">
              <SparklesIcon className="h-16 w-16 text-green-600 mx-auto animate-pulse" />
              <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Creating Your Meal Plan</h3>
              <p className="text-gray-600">Our AI is crafting the perfect meals for your preferences...</p>
            </div>
          </div>
        )}

        {/* Step 3: Demo Meal Plan Results */}
        {step === 3 && !loading && (
          <div className="space-y-6">
            {/* Demo Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="font-medium text-yellow-900">This is a Demo Meal Plan</h4>
                  <p className="text-yellow-800 text-sm mt-1">
                    Showing 3 days only. Sign up to get your full 7-day personalized meal plan with grocery list!
                  </p>
                </div>
              </div>
            </div>

            {/* Meal Plan Grid */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Your Demo Meal Plan</h2>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Estimated 3-day cost</div>
                  <div className="text-2xl font-bold text-green-600">${calculateTotalCost().toFixed(2)}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {['Monday', 'Tuesday', 'Wednesday'].map((day) => (
                  <div key={day} className="border rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-4">{day}</h3>
                    {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                      const meal = demoMealPlan.find(m => m.day === day && m.type === mealType);
                      if (!meal) return null;
                      
                      return (
                        <div key={mealType} className="mb-4 pb-4 border-b last:border-b-0">
                          <div className="text-sm font-medium text-gray-600 capitalize mb-1">
                            {mealType}
                          </div>
                          <div className="font-medium text-gray-900">{meal.name}</div>
                          <div className="flex items-center mt-1 text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {meal.cookTime} min
                            <CurrencyDollarIcon className="h-4 w-4 ml-3 mr-1" />
                            ${meal.estimatedCost.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Blurred Days */}
              <div className="mt-6 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white to-transparent z-10" />
                <div className="filter blur-sm">
                  <h3 className="text-center text-gray-600 mb-4">Continue to see Thursday - Sunday...</h3>
                  <div className="grid md:grid-cols-4 gap-4 opacity-50">
                    {['Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <div key={day} className="border rounded-lg p-4 h-48">
                        <h4 className="font-semibold">{day}</h4>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Unlock CTA */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md">
                    <LockClosedIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Unlock Your Full Meal Plan
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Sign up to see your complete 7-day meal plan, grocery list, and start saving money!
                    </p>
                    <button
                      onClick={handleSignUp}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-full"
                    >
                      Sign Up & Get Full Access
                    </button>
                    <p className="text-sm text-gray-500 mt-3">No credit card required</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Comparison */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">What You Get with a Free Account</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Demo (Current)</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-600">
                      <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                      3-day sample meal plan
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                      Basic cost estimates
                    </li>
                    <li className="flex items-center text-gray-400">
                      <span className="w-5 h-5 mr-2 text-center">✕</span>
                      No grocery list
                    </li>
                    <li className="flex items-center text-gray-400">
                      <span className="w-5 h-5 mr-2 text-center">✕</span>
                      Can't save or modify
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Free Account</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-600">
                      <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                      Full 7-day meal plans
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                      Smart grocery lists
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                      Save & customize meals
                    </li>
                    <li className="flex items-center text-gray-600">
                      <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
                      Budget tracking
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 text-center">
                <button
                  onClick={handleSignUp}
                  className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
                >
                  Create Your Free Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoPage; 