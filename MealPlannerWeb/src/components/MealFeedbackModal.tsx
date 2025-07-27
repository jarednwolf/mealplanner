import React, { useState } from 'react';
import { XMarkIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as ThumbUpSolid, HandThumbDownIcon as ThumbDownSolid } from '@heroicons/react/24/solid';

interface MealFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealName: string;
  onSubmit: (rating: 'positive' | 'negative', reasons: string[], comment?: string) => Promise<void>;
}

const MealFeedbackModal: React.FC<MealFeedbackModalProps> = ({
  isOpen,
  onClose,
  mealName,
  onSubmit
}) => {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const positiveReasons = [
    'Delicious taste',
    'Easy to prepare',
    'Good portion size',
    'Healthy ingredients',
    'Family loved it',
    'Great value',
    'Would make again',
    'Nice presentation'
  ];

  const negativeReasons = [
    'Didn\'t like the taste',
    'Too complicated',
    'Portion too small',
    'Portion too large',
    'Too expensive',
    'Missing ingredients',
    'Took too long',
    'Family didn\'t like it'
  ];

  const currentReasons = rating === 'positive' ? positiveReasons : negativeReasons;

  const toggleReason = (reason: string) => {
    if (selectedReasons.includes(reason)) {
      setSelectedReasons(selectedReasons.filter(r => r !== reason));
    } else {
      setSelectedReasons([...selectedReasons, reason]);
    }
  };

  const handleSubmit = async () => {
    if (!rating || selectedReasons.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(rating, selectedReasons, comment || undefined);
      // Reset form
      setRating(null);
      setSelectedReasons([]);
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              How was {mealName}?
            </h3>
            <p className="text-sm text-gray-600">
              Your feedback helps us suggest better meals for you
            </p>
          </div>

          {/* Rating Selection */}
          {!rating && (
            <div className="flex justify-center gap-8 mb-8">
              <button
                onClick={() => setRating('positive')}
                className="group flex flex-col items-center p-6 rounded-lg hover:bg-green-50 transition-colors"
              >
                <HandThumbUpIcon className="h-16 w-16 text-gray-400 group-hover:text-green-500 transition-colors" />
                <span className="mt-2 text-lg font-medium text-gray-700 group-hover:text-green-700">
                  Liked it!
                </span>
              </button>
              
              <button
                onClick={() => setRating('negative')}
                className="group flex flex-col items-center p-6 rounded-lg hover:bg-red-50 transition-colors"
              >
                <HandThumbDownIcon className="h-16 w-16 text-gray-400 group-hover:text-red-500 transition-colors" />
                <span className="mt-2 text-lg font-medium text-gray-700 group-hover:text-red-700">
                  Not for me
                </span>
              </button>
            </div>
          )}

          {/* Reason Selection */}
          {rating && (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    What specifically?
                  </h4>
                  <button
                    onClick={() => {
                      setRating(null);
                      setSelectedReasons([]);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Change rating
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  {rating === 'positive' ? (
                    <ThumbUpSolid className="h-6 w-6 text-green-500" />
                  ) : (
                    <ThumbDownSolid className="h-6 w-6 text-red-500" />
                  )}
                  <span className={`font-medium ${
                    rating === 'positive' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {rating === 'positive' ? 'Liked it!' : 'Not for me'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {currentReasons.map(reason => (
                    <button
                      key={reason}
                      onClick={() => toggleReason(reason)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedReasons.includes(reason)
                          ? rating === 'positive'
                            ? 'bg-green-100 text-green-700 border-2 border-green-300'
                            : 'bg-red-100 text-red-700 border-2 border-red-300'
                          : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Comment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional comments (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Tell us more about your experience..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={selectedReasons.length === 0 || isSubmitting}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    rating === 'positive'
                      ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300'
                      : 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300'
                  } disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MealFeedbackModal; 