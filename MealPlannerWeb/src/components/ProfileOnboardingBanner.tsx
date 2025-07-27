import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { CheckIcon, XMarkIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface ProfileOnboardingBannerProps {
  userProfile: UserProfile | null;
  onDismiss?: () => void;
}

const ProfileOnboardingBanner: React.FC<ProfileOnboardingBannerProps> = ({ 
  userProfile, 
  onDismiss 
}) => {
  const navigate = useNavigate();
  const [isMinimized, setIsMinimized] = useState(false);

  // Check requirements
  const requirements = [
    {
      label: 'Household Members',
      isComplete: !!userProfile && userProfile.householdSize > 0,
      tab: 'members'
    },
    {
      label: 'Weekly Budget',
      isComplete: !!userProfile && userProfile.weeklyBudget > 0,
      tab: 'preferences'
    },
    {
      label: 'Cooking Time',
      isComplete: !!userProfile?.cookingTimePreference?.weekday && 
                  userProfile.cookingTimePreference.weekday > 0 &&
                  !!userProfile?.cookingTimePreference?.weekend && 
                  userProfile.cookingTimePreference.weekend > 0,
      tab: 'cooking'
    }
  ];

  const completedCount = requirements.filter(req => req.isComplete).length;
  const isComplete = completedCount === requirements.length;

  // Don't render at all if complete to avoid any transition effects
  if (isComplete || !userProfile) return null;

  if (isMinimized) {
    return (
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">
                Complete your profile to start creating meal plans ({completedCount}/3 done)
              </span>
              <button
                onClick={() => navigate('/profile')}
                className="text-sm underline hover:no-underline"
              >
                Continue Setup
              </button>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="text-white/80 hover:text-white"
            >
              <ArrowRightIcon className="h-4 w-4 rotate-90" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Minimize/close buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white/60 hover:text-white/80 transition-colors"
            title="Minimize"
          >
            <ArrowRightIcon className="h-4 w-4 -rotate-90" />
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-white/60 hover:text-white/80 transition-colors"
              title="Dismiss"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome! Let's Set Up Your Meal Planning Profile
          </h2>
          <p className="text-lg text-green-100">
            Just a few quick steps to start saving time and money on your meals
          </p>
        </div>

        {/* Progress steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {requirements.map((req, index) => (
              <div key={index} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${
                    req.isComplete 
                      ? 'bg-white text-green-600' 
                      : 'bg-white/20 text-white border-2 border-white/40'
                  }`}>
                    {req.isComplete ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    req.isComplete ? 'text-white' : 'text-green-100'
                  }`}>
                    {req.label}
                  </span>
                </div>
                {index < requirements.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 ${
                    req.isComplete ? 'bg-white' : 'bg-white/30'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => navigate('/profile')}
            className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg inline-flex items-center"
          >
            Complete Profile Setup
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </button>
          <p className="text-sm text-green-100 mt-3">
            Takes less than 2 minutes • No credit card required
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileOnboardingBanner; 