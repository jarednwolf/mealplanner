import React from 'react';
import { HouseholdMember } from '../types';
import {
  UserIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  FireIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

interface HouseholdMemberCardProps {
  member: HouseholdMember;
  onEdit: (member: HouseholdMember) => void;
  onDelete: (memberId: string) => void;
  onViewPreferences: (member: HouseholdMember) => void;
  onCopy: (member: HouseholdMember) => void;
}

const HouseholdMemberCard: React.FC<HouseholdMemberCardProps> = ({
  member,
  onEdit,
  onDelete,
  onViewPreferences,
  onCopy
}) => {
  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'self':
        return 'bg-blue-100 text-blue-700';
      case 'spouse':
      case 'partner':
        return 'bg-pink-100 text-pink-700';
      case 'child':
        return 'bg-purple-100 text-purple-700';
      case 'parent':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSpiceIcon = (preference: string) => {
    switch (preference) {
      case 'none':
        return '🥛';
      case 'mild':
        return '🌶️';
      case 'medium':
        return '🌶️🌶️';
      case 'hot':
        return '🌶️🌶️🌶️';
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-full shadow-md">
            <UserIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {member.name}
              {member.relationship === 'self' && <span className="text-sm font-normal text-gray-500 ml-1">(You)</span>}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRelationshipColor(member.relationship)}`}>
              {member.relationship === 'self' ? 'Primary Account' : member.relationship.charAt(0).toUpperCase() + member.relationship.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onViewPreferences(member)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="View Preferences"
          >
            <HeartIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onCopy(member)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Copy Member"
          >
            <DocumentDuplicateIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onEdit(member)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Member"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {member.relationship !== 'self' && (
            <button
              onClick={() => onDelete(member.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Member"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="space-y-3">
        {/* Dietary Restrictions */}
        {(member.dietaryRestrictions.length > 0 || member.allergens.length > 0) && (
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Restrictions & Allergens</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {member.dietaryRestrictions.map(restriction => (
                  <span key={restriction} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                    {restriction}
                  </span>
                ))}
                {member.allergens.map(allergen => (
                  <span key={allergen} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                    {allergen} (Allergen)
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preferences */}
        <div className="flex items-start space-x-2">
          <HeartIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Preferences</p>
            <div className="mt-1 space-y-1">
              <p className="text-xs text-gray-600">
                Portion: <span className="font-medium">{member.portionSize}</span>
              </p>
              <p className="text-xs text-gray-600">
                Spice Level: <span className="font-medium">{getSpiceIcon(member.spicePreference)}</span>
              </p>
              {member.cuisinePreferences.length > 0 && (
                <p className="text-xs text-gray-600">
                  Cuisines: <span className="font-medium">{member.cuisinePreferences.slice(0, 3).join(', ')}{member.cuisinePreferences.length > 3 && '...'}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Meal Preferences */}
        <div className="flex items-start space-x-2">
          <FireIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Eats</p>
            <div className="flex gap-2 mt-1">
              {member.mealPreferences.breakfast && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Breakfast</span>
              )}
              {member.mealPreferences.lunch && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Lunch</span>
              )}
              {member.mealPreferences.dinner && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Dinner</span>
              )}
              {member.mealPreferences.snacks && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Snacks</span>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Nutrition */}
        {member.advancedNutrition?.enabled && (
          <div className="flex items-start space-x-2">
            <div className="h-5 w-5 flex-shrink-0 mt-0.5">
              <svg className="h-full w-full text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Nutrition Targets</p>
              <div className="mt-1 space-y-1">
                {member.advancedNutrition.dailyCalories && (
                  <p className="text-xs text-gray-600">
                    Daily Calories: <span className="font-medium">{member.advancedNutrition.dailyCalories}</span>
                  </p>
                )}
                {member.advancedNutrition.macros && (
                  <p className="text-xs text-gray-600">
                    Macros: <span className="font-medium">
                      {member.advancedNutrition.macros.protein}g P / 
                      {member.advancedNutrition.macros.carbs}g C / 
                      {member.advancedNutrition.macros.fat}g F
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {member.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 italic">"{member.notes}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HouseholdMemberCard; 