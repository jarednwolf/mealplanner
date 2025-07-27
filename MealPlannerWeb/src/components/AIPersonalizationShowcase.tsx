import React, { useState } from 'react';
import { UserGroupIcon, CpuChipIcon, ShoppingCartIcon, SparklesIcon } from '@heroicons/react/24/outline';

const AIPersonalizationShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'family' | 'learning' | 'shopping' | 'smart'>('family');

  const features = {
    family: {
      title: 'Knows Your Family',
      icon: UserGroupIcon,
      description: 'Tracks individual preferences for each family member',
      examples: [
        'Dad loves spicy food, Mom is lactose-intolerant',
        'Kids won\'t eat mushrooms or bell peppers',
        'Grandma needs low-sodium options when she visits',
        'Teen is trying vegetarian this month'
      ],
      comparison: 'Meal kits: One-size-fits-all approach'
    },
    learning: {
      title: 'Learns & Adapts',
      icon: CpuChipIcon,
      description: 'Gets smarter with every meal you make',
      examples: [
        'Notices you always skip breakfast on Tuesdays',
        'Learns you prefer quick meals on soccer nights',
        'Remembers which recipes were actually hits',
        'Adapts portions based on actual consumption'
      ],
      comparison: 'Meal kits: Same suggestions every time'
    },
    shopping: {
      title: 'Shop Anywhere',
      icon: ShoppingCartIcon,
      description: 'Works with all your favorite stores',
      examples: [
        'Compares prices at Kroger, Aldi, and Whole Foods',
        'Uses your Costco membership for bulk items',
        'Includes farmers market for fresh produce',
        'Applies digital coupons automatically'
      ],
      comparison: 'Meal kits: Locked to their inventory'
    },
    smart: {
      title: 'Truly Smart',
      icon: SparklesIcon,
      description: 'Considers everything that matters',
      examples: [
        'Weather-based meals (soup on cold days)',
        'Holiday and event planning built-in',
        'Seasonal ingredient optimization',
        'Leftover transformation suggestions'
      ],
      comparison: 'Meal kits: Generic weekly boxes'
    }
  };

  const currentFeature = features[activeTab];

  return (
    <section className="py-24 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            AI That Actually Understands Your Family
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Not pattern matching. Not generic suggestions. Real learning about your actual family's needs.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {(Object.entries(features) as Array<[keyof typeof features, typeof features[keyof typeof features]]>).map(([key, feature]) => {
            const Icon = feature.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === key
                    ? 'bg-white shadow-lg text-green-600 ring-2 ring-green-600'
                    : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-md'
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {feature.title}
              </button>
            );
          })}
        </div>

        {/* Content Display */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {currentFeature.title}
              </h3>
              <p className="text-lg text-gray-700 mb-6">
                {currentFeature.description}
              </p>
              
              <div className="space-y-3 mb-8">
                {currentFeature.examples.map((example: string, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-green-600" />
                    </div>
                    <span className="ml-3 text-gray-700">{example}</span>
                  </div>
                ))}
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm font-medium text-red-800 mb-1">
                  How others do it:
                </div>
                <div className="text-red-700">
                  {currentFeature.comparison}
                </div>
              </div>
            </div>

            {/* Visual Representation */}
            <div className="relative">
              <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl p-8">
                {activeTab === 'family' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Dad</span>
                        <span className="text-sm text-gray-600">🌶️ Spicy lover</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: '90%' }} />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Mom</span>
                        <span className="text-sm text-gray-600">🥛 No dairy</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Kids</span>
                        <span className="text-sm text-gray-600">🥦 Picky eaters</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'learning' && (
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                        <CpuChipIcon className="h-16 w-16 text-white" />
                      </div>
                      <div className="absolute -top-4 -right-4 bg-blue-500 text-white rounded-full px-3 py-1 text-sm font-medium">
                        Learning...
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-3 text-sm">
                        <div className="font-medium">Pattern Found</div>
                        <div className="text-gray-600">Quick meals on Wednesdays</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-sm">
                        <div className="font-medium">Preference Updated</div>
                        <div className="text-gray-600">More vegetarian options</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'shopping' && (
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <img src="https://cdn.worldvectorlogo.com/logos/kroger-2.svg" alt="Kroger" className="h-8 w-auto mr-3" />
                        <span className="font-medium">Kroger</span>
                      </div>
                      <span className="text-green-600 font-semibold">$45.23</span>
                    </div>
                    <div className="bg-white rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <img src="https://cdn.worldvectorlogo.com/logos/aldi-1.svg" alt="Aldi" className="h-8 w-auto mr-3" />
                        <span className="font-medium">Aldi</span>
                      </div>
                      <span className="text-green-600 font-semibold">$38.91</span>
                    </div>
                    <div className="bg-white rounded-lg p-4 flex items-center justify-between opacity-50">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-300 rounded mr-3" />
                        <span className="font-medium">Farmers Market</span>
                      </div>
                      <span className="text-gray-600">Seasonal</span>
                    </div>
                  </div>
                )}

                {activeTab === 'smart' && (
                  <div className="text-center space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-4xl mb-2">🌧️</div>
                      <div className="font-medium">Rainy Tuesday</div>
                      <div className="text-sm text-gray-600">Suggesting comfort foods</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-4xl mb-2">🎃</div>
                      <div className="font-medium">Halloween Week</div>
                      <div className="text-sm text-gray-600">Added party snacks to plan</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-700 mb-6">
            Experience the difference of AI that actually learns your family
          </p>
          <button
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-flex items-center"
          >
            See It In Action
            <SparklesIcon className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default AIPersonalizationShowcase; 