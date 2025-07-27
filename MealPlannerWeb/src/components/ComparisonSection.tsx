import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ComparisonSection: React.FC = () => {
  const comparisons = [
    {
      feature: 'Shop at ANY store',
      us: true,
      mealKits: false,
      description: 'Use your favorite grocery stores, farmers markets, or online retailers'
    },
    {
      feature: 'True family personalization',
      us: true,
      mealKits: false,
      description: 'Learns each family member\'s actual preferences, not generic patterns'
    },
    {
      feature: 'Budget optimization',
      us: true,
      mealKits: false,
      description: 'Finds the best deals and uses coupons across all stores'
    },
    {
      feature: 'Use what you have',
      us: true,
      mealKits: false,
      description: 'Integrates with your pantry to reduce waste'
    },
    {
      feature: 'Unlimited variety',
      us: true,
      mealKits: false,
      description: 'Access to 40,000+ items vs. 600 limited options'
    },
    {
      feature: 'Support local businesses',
      us: true,
      mealKits: false,
      description: 'Shop at local stores and farmers markets'
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Families Choose Us Over Meal Kits
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meal kit services lock you into their limited selection and premium prices. 
            We give you the freedom to shop anywhere while saving more.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-6 px-8 text-lg font-semibold text-gray-900">
                    Feature
                  </th>
                  <th className="text-center py-6 px-8">
                    <div className="inline-flex items-center justify-center">
                      <span className="text-lg font-semibold text-green-600">MealPlanner</span>
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">You</span>
                    </div>
                  </th>
                  <th className="text-center py-6 px-8">
                    <span className="text-lg font-semibold text-gray-500">Meal Kit Services</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-6 px-8">
                      <div>
                        <div className="font-medium text-gray-900">{item.feature}</div>
                        <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                      </div>
                    </td>
                    <td className="text-center py-6 px-8">
                      {item.us ? (
                        <CheckIcon className="h-6 w-6 text-green-600 mx-auto" />
                      ) : (
                        <XMarkIcon className="h-6 w-6 text-gray-300 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-6 px-8">
                      {item.mealKits ? (
                        <CheckIcon className="h-6 w-6 text-green-600 mx-auto" />
                      ) : (
                        <XMarkIcon className="h-6 w-6 text-gray-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                The Smart Alternative to Meal Kits
              </h3>
              <p className="text-gray-700 mb-6">
                Why pay $10-15 per serving for limited options when you can get personalized meal plans 
                that work with your favorite stores at half the cost?
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Average family saves $200+ per month vs. meal kits</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Choose from 40,000+ items, not just 600</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Support your local grocery stores and farmers</span>
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h4 className="font-semibold text-gray-900 mb-4">Real Family Example:</h4>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Meal Kit Service</div>
                  <div className="text-2xl font-bold text-red-600">$280/week</div>
                  <div className="text-sm text-gray-500">4 people, 5 dinners only</div>
                </div>
                <div className="border-t pt-4">
                  <div className="text-sm text-gray-600">With MealPlanner</div>
                  <div className="text-2xl font-bold text-green-600">$150/week</div>
                  <div className="text-sm text-gray-500">4 people, ALL meals + snacks</div>
                </div>
                <div className="bg-green-100 rounded-lg p-3">
                  <div className="text-green-800 font-semibold">You Save: $130/week</div>
                  <div className="text-green-700 text-sm">That's $6,760 per year!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection; 