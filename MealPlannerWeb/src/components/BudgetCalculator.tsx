import React, { useState, useEffect } from 'react';
import { CurrencyDollarIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface BudgetCalculatorProps {
  onSavingsCalculated?: (savings: number) => void;
}

const BudgetCalculator: React.FC<BudgetCalculatorProps> = ({ onSavingsCalculated }) => {
  const [currentSpending, setCurrentSpending] = useState(200);
  const [familySize, setFamilySize] = useState(4);
  const [eatingOutFrequency, setEatingOutFrequency] = useState(3);
  const [estimatedSavings, setEstimatedSavings] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    calculateSavings();
  }, [currentSpending, familySize, eatingOutFrequency]);

  const calculateSavings = () => {
    // Base savings from meal planning efficiency (20-30%)
    const baseSavingsPercent = 0.25;
    const baseSavings = currentSpending * baseSavingsPercent;
    
    // Additional savings from reducing eating out
    const avgMealOutCost = 15 * familySize;
    const eatingOutSavings = eatingOutFrequency * avgMealOutCost * 0.7; // Save 70% by cooking at home
    
    // Bulk buying and waste reduction savings
    const bulkSavings = familySize * 5; // More savings with larger families
    
    const totalSavings = Math.round(baseSavings + eatingOutSavings + bulkSavings);
    setEstimatedSavings(totalSavings);
    
    if (onSavingsCalculated) {
      onSavingsCalculated(totalSavings);
    }
  };

  const handleCalculate = () => {
    setShowResults(true);
    calculateSavings();
  };

  const annualSavings = estimatedSavings * 52;

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-6">
        <CurrencyDollarIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h3 className="text-2xl font-bold text-gray-900">Calculate Your Savings</h3>
        <p className="text-gray-600 mt-2">See how much you could save with smart meal planning</p>
      </div>

      <div className="space-y-6">
        {/* Current Weekly Spending */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current weekly grocery spending
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="50"
              max="400"
              value={currentSpending}
              onChange={(e) => setCurrentSpending(parseInt(e.target.value))}
              className="flex-1"
            />
            <div className="w-24 text-right">
              <span className="text-2xl font-bold text-gray-900">${currentSpending}</span>
            </div>
          </div>
        </div>

        {/* Family Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Family size
          </label>
          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((size) => (
              <button
                key={size}
                onClick={() => setFamilySize(size)}
                className={`py-2 px-3 rounded-lg border ${
                  familySize === size
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {size}{size === 6 ? '+' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Eating Out Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How often do you eat out or order takeout per week?
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((freq) => (
              <button
                key={freq}
                onClick={() => setEatingOutFrequency(freq)}
                className={`py-2 px-3 rounded-lg border ${
                  eatingOutFrequency === freq
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {freq === 0 ? 'Never' : freq === 4 ? '4+' : `${freq}x`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        className="w-full mt-8 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
      >
        <SparklesIcon className="h-5 w-5 mr-2" />
        Calculate My Savings
      </button>

      {/* Results */}
      {showResults && (
        <div className="mt-8 p-6 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Estimated Weekly Savings</p>
            <p className="text-4xl font-bold text-green-600 mb-4">${estimatedSavings}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">Monthly</p>
                <p className="text-2xl font-bold text-gray-900">${estimatedSavings * 4}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">Annually</p>
                <p className="text-2xl font-bold text-gray-900">${annualSavings.toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-6 text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">Your savings come from:</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Smarter shopping with AI-optimized meal plans</li>
                <li>• Reduced food waste through better planning</li>
                <li>• Bulk buying opportunities</li>
                <li>• Less impulse purchasing</li>
                {eatingOutFrequency > 0 && <li>• Cooking more meals at home</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetCalculator; 