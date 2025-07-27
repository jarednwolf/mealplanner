import React, { useState, useEffect } from 'react';
import { HouseholdMember } from '../types';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface AddEditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<HouseholdMember, 'id' | 'createdAt' | 'updatedAt'>) => void;
  member?: HouseholdMember | null;
  userId: string;
}

const AddEditMemberModal: React.FC<AddEditMemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  member,
  userId
}) => {
  const [formData, setFormData] = useState<Omit<HouseholdMember, 'id' | 'createdAt' | 'updatedAt'>>({
    userId,
    name: '',
    age: undefined,
    relationship: 'spouse',
    dietaryRestrictions: [],
    cuisinePreferences: [],
    allergens: [],
    dislikedIngredients: [],
    favoriteIngredients: [],
    mealPreferences: {
      breakfast: true,
      lunch: true,
      dinner: true,
      snacks: false
    },
    portionSize: 'regular',
    spicePreference: 'medium',
    advancedNutrition: {
      enabled: false,
      dailyCalories: undefined,
      macros: undefined
    },
    notes: ''
  });

  const [newAllergen, setNewAllergen] = useState('');
  const [newDisliked, setNewDisliked] = useState('');
  const [newFavorite, setNewFavorite] = useState('');

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Nut-Free',
    'Keto',
    'Paleo',
    'Low-Carb',
    'Halal',
    'Kosher',
    'Pescatarian'
  ];

  const cuisineOptions = [
    'Italian',
    'Mexican',
    'Chinese',
    'Japanese',
    'Indian',
    'Thai',
    'Mediterranean',
    'American',
    'French',
    'Korean',
    'Vietnamese',
    'Greek',
    'Spanish',
    'Ethiopian',
    'Middle Eastern'
  ];

  const commonAllergens = [
    'Peanuts',
    'Tree Nuts',
    'Milk',
    'Eggs',
    'Wheat',
    'Soy',
    'Fish',
    'Shellfish',
    'Sesame'
  ];

  useEffect(() => {
    if (member) {
      setFormData({
        userId: userId || member.userId,
        name: member.name,
        age: member.age,
        relationship: member.relationship,
        dietaryRestrictions: member.dietaryRestrictions,
        cuisinePreferences: member.cuisinePreferences,
        allergens: member.allergens,
        dislikedIngredients: member.dislikedIngredients,
        favoriteIngredients: member.favoriteIngredients,
        mealPreferences: member.mealPreferences,
        portionSize: member.portionSize,
        spicePreference: member.spicePreference,
        advancedNutrition: member.advancedNutrition || {
          enabled: false,
          dailyCalories: undefined,
          macros: undefined
        },
        notes: member.notes || ''
      });
    } else if (isOpen) {
      // Reset form for new member
      setFormData({
        userId: userId,
        name: '',
        age: undefined,
        relationship: 'spouse',
        dietaryRestrictions: [],
        cuisinePreferences: [],
        allergens: [],
        dislikedIngredients: [],
        favoriteIngredients: [],
        mealPreferences: {
          breakfast: true,
          lunch: true,
          dinner: true,
          snacks: false
        },
        portionSize: 'regular',
        spicePreference: 'medium',
        advancedNutrition: {
          enabled: false,
          dailyCalories: undefined,
          macros: undefined
        },
        notes: ''
      });
    }
  }, [member, userId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter a name for the household member');
      return;
    }
    
    // Ensure userId is set
    const dataToSave = {
      ...formData,
      userId: userId,
      name: formData.name.trim()
    };
    
    onSave(dataToSave);
    // Note: onClose is now handled in the parent component after successful save
  };

  const toggleDietaryRestriction = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const toggleCuisine = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisinePreferences: prev.cuisinePreferences.includes(cuisine)
        ? prev.cuisinePreferences.filter(c => c !== cuisine)
        : [...prev.cuisinePreferences, cuisine]
    }));
  };

  const addAllergen = () => {
    if (newAllergen.trim() && !formData.allergens.includes(newAllergen.trim())) {
      setFormData(prev => ({
        ...prev,
        allergens: [...prev.allergens, newAllergen.trim()]
      }));
      setNewAllergen('');
    }
  };

  const removeAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter(a => a !== allergen)
    }));
  };

  const addDisliked = () => {
    if (newDisliked.trim() && !formData.dislikedIngredients.includes(newDisliked.trim())) {
      setFormData(prev => ({
        ...prev,
        dislikedIngredients: [...prev.dislikedIngredients, newDisliked.trim()]
      }));
      setNewDisliked('');
    }
  };

  const removeDisliked = (ingredient: string) => {
    setFormData(prev => ({
      ...prev,
      dislikedIngredients: prev.dislikedIngredients.filter(i => i !== ingredient)
    }));
  };

  const addFavorite = () => {
    if (newFavorite.trim() && !formData.favoriteIngredients.includes(newFavorite.trim())) {
      setFormData(prev => ({
        ...prev,
        favoriteIngredients: [...prev.favoriteIngredients, newFavorite.trim()]
      }));
      setNewFavorite('');
    }
  };

  const removeFavorite = (ingredient: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteIngredients: prev.favoriteIngredients.filter(i => i !== ingredient)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {member?.id ? 'Edit Household Member' : 'Add Household Member'}
              </h2>
              {member && !member.id && (
                <p className="text-sm text-gray-600 mt-1">
                  Based on {(member as any)._originalName || member.name || 'another member'}'s preferences
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={formData.age || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.relationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="self">Self</option>
                    <option value="spouse">Spouse</option>
                    <option value="partner">Partner</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="roommate">Roommate</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portion Size
                  </label>
                  <select
                    value={formData.portionSize}
                    onChange={(e) => setFormData(prev => ({ ...prev, portionSize: e.target.value as any }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="small">Small</option>
                    <option value="regular">Regular</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Meal Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Meal Preferences</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(formData.mealPreferences).map(([meal, selected]) => (
                  <label key={meal} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        mealPreferences: {
                          ...prev.mealPreferences,
                          [meal]: e.target.checked
                        }
                      }))}
                      className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 capitalize">{meal}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Dietary Restrictions</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {dietaryOptions.map(option => (
                  <label key={option} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dietaryRestrictions.includes(option)}
                      onChange={() => toggleDietaryRestriction(option)}
                      className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Allergens */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Allergens</h3>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {commonAllergens.map(allergen => (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => {
                      if (!formData.allergens.includes(allergen)) {
                        setFormData(prev => ({ ...prev, allergens: [...prev.allergens, allergen] }));
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.allergens.includes(allergen)
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {allergen}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergen())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Add custom allergen"
                />
                <button
                  type="button"
                  onClick={addAllergen}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>

              {formData.allergens.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.allergens.map(allergen => (
                    <span key={allergen} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                      {allergen}
                      <button
                        type="button"
                        onClick={() => removeAllergen(allergen)}
                        className="ml-1 hover:text-red-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Cuisine Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Cuisine Preferences</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cuisineOptions.map(cuisine => (
                  <label key={cuisine} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.cuisinePreferences.includes(cuisine)}
                      onChange={() => toggleCuisine(cuisine)}
                      className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">{cuisine}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Spice Preference */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Spice Preference</h3>
              
              <div className="grid grid-cols-4 gap-3">
                {(['none', 'mild', 'medium', 'hot'] as const).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, spicePreference: level }))}
                    className={`p-3 rounded-lg font-medium capitalize transition-all ${
                      formData.spicePreference === level
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level === 'none' ? 'No Spice' : level}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Nutrition */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Advanced Nutrition</h3>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.advancedNutrition?.enabled || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      advancedNutrition: {
                        ...prev.advancedNutrition!,
                        enabled: e.target.checked
                      }
                    }))}
                    className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable nutrition tracking</span>
                </label>
              </div>
              
              {formData.advancedNutrition?.enabled && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Daily Calorie Target
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.advancedNutrition.dailyCalories || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        advancedNutrition: {
                          ...prev.advancedNutrition!,
                          dailyCalories: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="2000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Macronutrient Targets (grams)</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Protein (g)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.advancedNutrition.macros?.protein || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            advancedNutrition: {
                              ...prev.advancedNutrition!,
                              macros: {
                                protein: e.target.value ? parseInt(e.target.value) : 0,
                                carbs: prev.advancedNutrition?.macros?.carbs || 0,
                                fat: prev.advancedNutrition?.macros?.fat || 0,
                                fiber: prev.advancedNutrition?.macros?.fiber
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Carbs (g)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.advancedNutrition.macros?.carbs || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            advancedNutrition: {
                              ...prev.advancedNutrition!,
                              macros: {
                                protein: prev.advancedNutrition?.macros?.protein || 0,
                                carbs: e.target.value ? parseInt(e.target.value) : 0,
                                fat: prev.advancedNutrition?.macros?.fat || 0,
                                fiber: prev.advancedNutrition?.macros?.fiber
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="250"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Fat (g)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.advancedNutrition.macros?.fat || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            advancedNutrition: {
                              ...prev.advancedNutrition!,
                              macros: {
                                protein: prev.advancedNutrition?.macros?.protein || 0,
                                carbs: prev.advancedNutrition?.macros?.carbs || 0,
                                fat: e.target.value ? parseInt(e.target.value) : 0,
                                fiber: prev.advancedNutrition?.macros?.fiber
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="65"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fiber (g) - Optional</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.advancedNutrition.macros?.fiber || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          advancedNutrition: {
                            ...prev.advancedNutrition!,
                            macros: {
                              protein: prev.advancedNutrition?.macros?.protein || 0,
                              carbs: prev.advancedNutrition?.macros?.carbs || 0,
                              fat: prev.advancedNutrition?.macros?.fat || 0,
                              fiber: e.target.value ? parseInt(e.target.value) : undefined
                            }
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="25"
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 italic">
                    These targets will be considered when generating meal plans for this household member.
                  </p>
                </div>
              )}
            </div>

            {/* Disliked Ingredients */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Disliked Ingredients</h3>
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newDisliked}
                  onChange={(e) => setNewDisliked(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDisliked())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., mushrooms, onions"
                />
                <button
                  type="button"
                  onClick={addDisliked}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>

              {formData.dislikedIngredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.dislikedIngredients.map(ingredient => (
                    <span key={ingredient} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                      {ingredient}
                      <button
                        type="button"
                        onClick={() => removeDisliked(ingredient)}
                        className="ml-1 hover:text-orange-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Favorite Ingredients */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Favorite Ingredients</h3>
              
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newFavorite}
                  onChange={(e) => setNewFavorite(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFavorite())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., avocado, chicken"
                />
                <button
                  type="button"
                  onClick={addFavorite}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>

              {formData.favoriteIngredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.favoriteIngredients.map(ingredient => (
                    <span key={ingredient} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      {ingredient}
                      <button
                        type="button"
                        onClick={() => removeFavorite(ingredient)}
                        className="ml-1 hover:text-green-900"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
              
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Any special notes about this person's preferences..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {member?.id ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditMemberModal; 