import React from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingItems: {
    field: string;
    label: string;
    tab?: string;
    description?: string;
  }[];
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ 
  isOpen, 
  onClose, 
  missingItems 
}) => {
  if (!isOpen) return null;

  // Group items by tab
  const itemsByTab: { [key: string]: typeof missingItems } = {};
  missingItems.forEach(item => {
    const tab = item.tab || 'general';
    if (!itemsByTab[tab]) {
      itemsByTab[tab] = [];
    }
    itemsByTab[tab].push(item);
  });

  const tabLabels: { [key: string]: string } = {
    general: 'General Information',
    preferences: 'Preferences',
    dietary: 'Dietary Restrictions',
    cooking: 'Cooking Preferences'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Complete Your Profile
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    To generate a personalized meal plan, we need some additional information about your preferences and household.
                  </p>
                </div>
                
                {/* Missing items grouped by tab */}
                <div className="mt-4 space-y-4">
                  {Object.entries(itemsByTab).map(([tab, items]) => (
                    <div key={tab} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        {tabLabels[tab] || tab}
                      </h4>
                      <ul className="space-y-2">
                        {items.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-yellow-400 mr-2">•</span>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">{item.label}</span>
                              {item.description && (
                                <span className="block text-xs text-gray-500 mt-0.5">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <Link
                        to={`/profile?tab=${tab}&from=meal-plan-incomplete`}
                        className="mt-3 inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700"
                        onClick={onClose}
                      >
                        Complete {tabLabels[tab]}
                        <span className="ml-1">→</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Link
              to="/profile?from=meal-plan-incomplete"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Go to Profile
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionModal; 