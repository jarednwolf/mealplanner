import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface MealPlanGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const generationSteps = [
  { id: 'preferences', label: 'Analyzing preferences', duration: 2000 },
  { id: 'recipes', label: 'Finding perfect recipes', duration: 3000 },
  { id: 'nutrition', label: 'Balancing nutrition', duration: 2000 },
  { id: 'budget', label: 'Optimizing for budget', duration: 2000 },
  { id: 'finalizing', label: 'Finalizing your plan', duration: 1000 }
];

const funFacts = [
  "Did you know? The average family throws away $1,500 of food per year. Our meal plans help reduce waste!",
  "Fun fact: Meal planning can save you 2-3 hours per week and reduce grocery costs by 15-20%.",
  "Pro tip: Tuesday is typically the best day for grocery deals at most stores.",
  "Did you know? Eating home-cooked meals just 3 times per week can save over $2,000 annually.",
  "Research shows meal planning reduces stress and improves nutrition quality by 33%."
];

const MealPlanGenerationModal: React.FC<MealPlanGenerationModalProps> = ({ 
  isOpen, 
  onClose, 
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [funFactIndex, setFunFactIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setCurrentStep(0);
      setProgress(0);
      setIsComplete(false);
      return;
    }

    // Start the generation process
    let stepTimeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    
    const runStep = (stepIndex: number) => {
      if (stepIndex >= generationSteps.length) {
        setIsComplete(true);
        setTimeout(() => {
          onComplete();
        }, 1000);
        return;
      }

      setCurrentStep(stepIndex);
      const duration = generationSteps[stepIndex].duration;
      let stepProgress = 0;

      // Smooth progress animation
      progressInterval = setInterval(() => {
        stepProgress += 2;
        const overallProgress = (stepIndex / generationSteps.length) * 100 + 
                               (stepProgress / 100) * (100 / generationSteps.length);
        setProgress(Math.min(overallProgress, 95));
      }, duration / 50);

      stepTimeout = setTimeout(() => {
        clearInterval(progressInterval);
        runStep(stepIndex + 1);
      }, duration);
    };

    runStep(0);

    // Rotate fun facts
    const factInterval = setInterval(() => {
      setFunFactIndex((prev) => (prev + 1) % funFacts.length);
    }, 4000);

    return () => {
      clearTimeout(stepTimeout);
      clearInterval(progressInterval);
      clearInterval(factInterval);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isComplete ? 'Your Meal Plan is Ready!' : 'Creating Your Perfect Meal Plan'}
              </h2>
              {!isComplete && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              )}
            </div>

            {!isComplete ? (
              <>
                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    {Math.round(progress)}% complete
                  </p>
                </div>

                {/* Current Step */}
                <div className="mb-8">
                  <div className="space-y-3">
                    {generationSteps.map((step, index) => (
                      <div 
                        key={step.id}
                        className={`flex items-center gap-3 transition-all duration-300 ${
                          index === currentStep 
                            ? 'scale-105' 
                            : index < currentStep 
                            ? 'opacity-50' 
                            : 'opacity-30'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          index < currentStep 
                            ? 'bg-green-500 text-white' 
                            : index === currentStep
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {index < currentStep ? (
                            <CheckCircleIcon className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        <p className={`text-sm font-medium ${
                          index === currentStep ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {step.label}
                          {index === currentStep && (
                            <span className="inline-block ml-2">
                              <span className="animate-pulse">•</span>
                              <span className="animate-pulse animation-delay-200">•</span>
                              <span className="animate-pulse animation-delay-400">•</span>
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fun Fact */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800 leading-relaxed">
                    💡 {funFacts[funFactIndex]}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircleIcon className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  All Done!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your personalized meal plan is ready to view
                </p>
                <button
                  onClick={onComplete}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  View Meal Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanGenerationModal; 