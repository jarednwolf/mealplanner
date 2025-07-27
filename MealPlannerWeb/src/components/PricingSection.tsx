import React, { useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: Array<{ text: string; included: boolean }>;
  cta: string;
  popular?: boolean;
}

const PricingSection: React.FC = () => {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const pricingTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out meal planning',
      features: [
        { text: 'Weekly meal plans (7 days)', included: true },
        { text: 'Basic grocery lists', included: true },
        { text: 'Save up to 3 meal plans', included: true },
        { text: 'Standard recipes', included: true },
        { text: 'Email support', included: true },
        { text: 'Advanced AI customization', included: false },
        { text: 'Nutrition tracking', included: false },
        { text: 'Meal plan sharing', included: false },
        { text: 'Priority support', included: false }
      ],
      cta: 'Start Free'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: billingPeriod === 'monthly' ? '$9.99' : '$99',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'Everything you need for smart meal planning',
      features: [
        { text: 'Weekly meal plans (7 days)', included: true },
        { text: 'Smart grocery lists with store optimization', included: true },
        { text: 'Unlimited saved meal plans', included: true },
        { text: 'Premium recipe collection (10,000+)', included: true },
        { text: 'Priority email & chat support', included: true },
        { text: 'Advanced AI customization', included: true },
        { text: 'Detailed nutrition tracking', included: true },
        { text: 'Share meal plans with family', included: true },
        { text: 'Pantry management', included: true }
      ],
      cta: 'Start Premium Trial',
      popular: true
    },
    {
      id: 'family',
      name: 'Family',
      price: billingPeriod === 'monthly' ? '$19.99' : '$199',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'Perfect for large households and meal prep enthusiasts',
      features: [
        { text: 'Everything in Premium', included: true },
        { text: 'Multiple meal plans per week', included: true },
        { text: 'Up to 6 family member accounts', included: true },
        { text: 'Meal prep mode', included: true },
        { text: 'Bulk shopping lists', included: true },
        { text: 'Recipe scaling (2-12 servings)', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom recipe requests', included: true },
        { text: 'White-glove onboarding', included: true }
      ],
      cta: 'Contact Sales'
    }
  ];

  const savings = billingPeriod === 'yearly' ? '17%' : null;

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that fits your family's needs
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${billingPeriod === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-600"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${billingPeriod === 'yearly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Yearly
              {savings && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Save {savings}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden ${
                tier.popular ? 'ring-2 ring-green-600' : ''
              }`}
            >
              {tier.popular && (
                <div className="bg-green-600 text-white text-center py-2 text-sm font-medium">
                  Most Popular
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 mb-6">{tier.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-600">{tier.period}</span>
                </div>

                <button
                  onClick={() => {
                    if (tier.id === 'family') {
                      // For family plan, could open a contact form
                      navigate('/login');
                    } else {
                      navigate('/login');
                    }
                  }}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    tier.popular
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tier.cta}
                </button>

                <div className="mt-8 space-y-3">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      {feature.included ? (
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                      ) : (
                        <XMarkIcon className="h-5 w-5 text-gray-300 mr-3 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-600">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time. 
                Changes take effect at the next billing cycle.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h4>
              <p className="text-gray-600">
                Premium plans come with a 7-day free trial. No credit card required to start!
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">How much can I really save?</h4>
              <p className="text-gray-600">
                Our users save an average of $200 per month on groceries through better planning 
                and reduced food waste. The app pays for itself!
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What if I have dietary restrictions?</h4>
              <p className="text-gray-600">
                Our AI handles all major dietary restrictions including vegan, gluten-free, 
                keto, allergies, and more. Fully customizable!
              </p>
            </div>
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-green-100 rounded-full">
            <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">30-day money-back guarantee on all paid plans</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 