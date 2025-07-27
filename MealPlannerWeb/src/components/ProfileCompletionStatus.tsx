import React from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { UserProfile } from '../types';

interface ProfileCompletionStatusProps {
  userProfile: UserProfile | null;
  onComplete?: () => void;
  variant?: 'compact' | 'detailed';
}

interface RequirementCheck {
  field: string;
  label: string;
  description: string;
  isComplete: boolean;
  value?: any;
}

const ProfileCompletionStatus: React.FC<ProfileCompletionStatusProps> = ({ 
  userProfile, 
  onComplete,
  variant = 'detailed' 
}) => {
  // Check all requirements
  const requirements: RequirementCheck[] = [
    {
      field: 'householdSize',
      label: 'Household Size',
      description: 'Number of people in your household',
      isComplete: !!userProfile && userProfile.householdSize > 0,
      value: userProfile?.householdSize
    },
    {
      field: 'weeklyBudget',
      label: 'Weekly Budget',
      description: 'Your target budget for groceries',
      isComplete: !!userProfile && userProfile.weeklyBudget > 0,
      value: userProfile?.weeklyBudget ? `$${userProfile.weeklyBudget}` : undefined
    },
    {
      field: 'cookingTimeWeekday',
      label: 'Weekday Cooking Time',
      description: 'Time available on weekdays',
      isComplete: !!userProfile?.cookingTimePreference?.weekday && userProfile.cookingTimePreference.weekday > 0,
      value: userProfile?.cookingTimePreference?.weekday ? `${userProfile.cookingTimePreference.weekday} min` : undefined
    },
    {
      field: 'cookingTimeWeekend',
      label: 'Weekend Cooking Time',
      description: 'Time available on weekends',
      isComplete: !!userProfile?.cookingTimePreference?.weekend && userProfile.cookingTimePreference.weekend > 0,
      value: userProfile?.cookingTimePreference?.weekend ? `${userProfile.cookingTimePreference.weekend} min` : undefined
    }
  ];

  const completedCount = requirements.filter(req => req.isComplete).length;
  const totalCount = requirements.length;
  const isComplete = completedCount === totalCount;
  const completionPercentage = (completedCount / totalCount) * 100;

  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-2">
        {isComplete ? (
          <>
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-700">Ready to create meal plans</span>
          </>
        ) : (
          <>
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-600">
              Complete your profile ({completedCount}/{totalCount})
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {/* Don't show "Profile Complete!" to avoid duplication with success toast */}
            Complete Your Profile
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isComplete 
              ? 'You\'re all set to create personalized meal plans'
              : 'We need a few more details to create your personalized meal plan'
            }
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{completedCount}/{totalCount}</div>
          <div className="text-sm text-gray-500">Complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isComplete ? 'bg-green-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Requirements list */}
      <div className="space-y-3">
        {requirements.map((req) => (
          <div 
            key={req.field}
            className={`flex items-start space-x-3 p-3 rounded-lg ${
              req.isComplete ? 'bg-green-50' : 'bg-gray-50'
            }`}
          >
            {req.isComplete ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <XCircleIcon className="h-5 w-5 text-gray-400 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  req.isComplete ? 'text-green-900' : 'text-gray-900'
                }`}>
                  {req.label}
                </span>
                {req.value && (
                  <span className="text-sm text-gray-600">{req.value}</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-0.5">{req.description}</p>
            </div>
          </div>
        ))}
      </div>

      {!isComplete && onComplete && (
        <button
          onClick={onComplete}
          className="mt-6 w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Complete Profile Setup
        </button>
      )}
    </div>
  );
};

export default ProfileCompletionStatus; 