import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserIcon,
  CurrencyDollarIcon,
  ClockIcon,
  HomeIcon,
  HeartIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface ProfileSetupCheckProps {
  userProfile: UserProfile | null;
  householdMemberCount?: number;
}

interface SetupRequirement {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isComplete: boolean;
  isRequired: boolean;
  description: string;
  action?: {
    label: string;
    path: string;
  };
}

const ProfileSetupCheck: React.FC<ProfileSetupCheckProps> = ({ 
  userProfile, 
  householdMemberCount = 0 
}) => {
  const navigate = useNavigate();

  // Check which setup requirements are complete
  const getSetupRequirements = (): SetupRequirement[] => {
    const requirements: SetupRequirement[] = [];

    // Basic profile info
    requirements.push({
      label: 'Basic Profile',
      icon: UserIcon,
      isComplete: !!(userProfile?.firstName || userProfile?.email),
      isRequired: true,
      description: 'Your name and basic information',
      action: {
        label: 'Complete Profile',
        path: '/profile'
      }
    });

    // Household size
    requirements.push({
      label: 'Household Size',
      icon: HomeIcon,
      isComplete: !!(userProfile && userProfile.householdSize > 0),
      isRequired: true,
      description: 'Number of people in your household',
      action: {
        label: 'Set Household Size',
        path: '/profile'
      }
    });

    // Budget
    requirements.push({
      label: 'Weekly Budget',
      icon: CurrencyDollarIcon,
      isComplete: !!(userProfile && userProfile.weeklyBudget > 0),
      isRequired: true,
      description: 'Your weekly grocery budget',
      action: {
        label: 'Set Budget',
        path: '/profile'
      }
    });

    // Cooking time preferences
    requirements.push({
      label: 'Cooking Preferences',
      icon: ClockIcon,
      isComplete: !!(
        userProfile && 
        userProfile.cookingTimePreference?.weekday > 0 &&
        userProfile.cookingTimePreference?.weekend > 0
      ),
      isRequired: true,
      description: 'Time available for cooking on weekdays and weekends',
      action: {
        label: 'Set Preferences',
        path: '/profile'
      }
    });

    // Household members (optional but recommended)
    requirements.push({
      label: 'Household Members',
      icon: HeartIcon,
      isComplete: householdMemberCount > 0,
      isRequired: false,
      description: 'Individual preferences for each household member (recommended)',
      action: {
        label: 'Add Members',
        path: '/profile?tab=household'
      }
    });

    return requirements;
  };

  const requirements = getSetupRequirements();
  const requiredIncomplete = requirements.filter(r => r.isRequired && !r.isComplete);
  const isSetupComplete = requiredIncomplete.length === 0;

  if (isSetupComplete) {
    return null; // Don't show anything if setup is complete
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Complete Your Setup First
            </h2>
            <p className="text-gray-600">
              To generate personalized meal plans, we need a bit more information about your household and preferences.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {requirements.map((requirement, index) => (
              <div
                key={index}
                className={`flex items-start p-4 rounded-lg border ${
                  requirement.isComplete 
                    ? 'border-green-200 bg-green-50' 
                    : requirement.isRequired
                    ? 'border-red-200 bg-red-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex-shrink-0 mr-4">
                  {requirement.isComplete ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  ) : (
                    <requirement.icon className={`h-6 w-6 ${
                      requirement.isRequired ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {requirement.label}
                        {!requirement.isRequired && (
                          <span className="ml-2 text-xs text-gray-500">(Optional)</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {requirement.description}
                      </p>
                    </div>
                    {!requirement.isComplete && requirement.action && (
                      <button
                        onClick={() => navigate(requirement.action!.path)}
                        className="ml-4 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        {requirement.action.label}
                        <ArrowRightIcon className="ml-1 h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => navigate('/profile')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Profile Settings
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetupCheck; 